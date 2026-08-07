import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.schemas.learn_ai import (
    RagQueryRequest, RagQueryResponse, AIWorkspacePayload,
    QuizSubmitRequest, QuizSubmitResponse
)
from app.services.pdf_ingestion_service import PDFIngestionService
from app.services.embedding_service import EmbeddingService
from app.services.ai_tutor_service import AITutorService
from app.models.resources import Resource
from app.models.learn_ai import AIDocument, AIDocumentChunk

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/learn-ai", tags=["Learn AI Tutor & RAG"])


async def background_ingest_resource_pdf(resource_id: str, pdf_url: str, title: str, db_session_factory):
    """Background task to fetch, deduplicate, chunk, embed, and store PDF vector embeddings."""
    db: Session = db_session_factory()
    try:
        pdf_bytes = await PDFIngestionService.download_pdf(pdf_url)
        file_hash = PDFIngestionService.calculate_file_hash(pdf_bytes)

        # 1. Deduplication check
        existing_doc = db.query(AIDocument).filter(AIDocument.file_hash == file_hash).first()
        if existing_doc:
            logger.info(f"Document hash {file_hash} already exists. Skipping chunk extraction.")
            return

        # 2. Layered Extraction
        pages_data = PDFIngestionService.extract_text_and_tables(pdf_bytes)

        # 3. Heading-Aware Chunking
        chunks = PDFIngestionService.create_heading_aware_chunks(pages_data)

        # 4. Save AIDocument
        ai_doc = AIDocument(
            resource_id=resource_id,
            title=title,
            file_hash=file_hash,
            storage_path=pdf_url,
            total_pages=len(pages_data)
        )
        db.add(ai_doc)
        db.flush()

        # 5. Generate Vector Embeddings & Save Chunks
        chunk_texts = [c["content"] for c in chunks]
        embeddings = EmbeddingService.embed_batch(chunk_texts)

        for chunk_data, vector in zip(chunks, embeddings):
            chunk_obj = AIDocumentChunk(
                document_id=ai_doc.id,
                resource_id=resource_id,
                page_number=chunk_data["page_number"],
                content=chunk_data["content"],
                chunk_metadata=chunk_data["metadata"],
                embedding=vector
            )
            db.add(chunk_obj)

        db.commit()
        logger.info(f"Successfully ingested & embedded {len(chunks)} chunks for resource {resource_id}.")

        # 6. Pre-generate Workspace Cache
        AITutorService.get_or_generate_workspace(db, resource_id, title)
    except Exception as e:
        logger.error(f"Error during background PDF ingestion for resource {resource_id}: {e}")
        db.rollback()
    finally:
        db.close()


@router.get("/workspace/{resource_id}", response_model=StandardResponse[Dict[str, Any]])
def get_ai_workspace(
    resource_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve cached AI Tutor Workspace payload (sub-15ms)
    or generate fallback payload for resource.
    """
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    title = resource.title if resource else f"Resource {resource_id}"
    pdf_url = resource.external_url if (resource and resource.external_url) else "https://ncert.nic.in/textbook/pdf/jemh101.pdf"

    workspace = AITutorService.get_or_generate_workspace(db, resource_id, title)
    workspace["pdf_url"] = pdf_url

    return StandardResponse.success_response(
        data=workspace,
        message="AI Tutor Workspace retrieved successfully."
    )


@router.post("/query", response_model=StandardResponse[Dict[str, Any]])
def solve_chapter_doubt(
    request: RagQueryRequest,
    db: Session = Depends(get_db)
):
    """
    AI Chapter Doubt Solver (RAG Chatbot):
    Accepts student question, queries vector DB via pgvector cosine distance search,
    and returns answer + cited textbook page numbers.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = AITutorService.answer_student_doubt(
        db=db,
        resource_id=request.resource_id,
        question=request.question
    )

    return StandardResponse.success_response(
        data=result,
        message="Doubt solved successfully."
    )


@router.post("/quiz/submit", response_model=StandardResponse[Dict[str, Any]])
def submit_quiz_answers(
    request: QuizSubmitRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates student quiz answers, calculates percentage score,
    identifies weak topics, and updates student progress.
    """
    # Demo user ID fallback for open practice
    demo_user_id = "00000000-0000-0000-0000-000000000000"
    
    result = AITutorService.grade_quiz(
        db=db,
        resource_id=request.resource_id,
        user_id=demo_user_id,
        answers=request.answers
    )

    return StandardResponse.success_response(
        data=result,
        message="Quiz evaluated successfully."
    )


@router.post("/ingest/{resource_id}", response_model=StandardResponse[Dict[str, str]])
def trigger_pdf_ingestion(
    resource_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger non-blocking PDF download, multi-modal extraction,
    heading-aware chunking, vector embedding, and workspace generation.
    """
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource or not resource.external_url:
        # If resource is not found in database, provide helpful feedback
        pdf_url = f"https://example.com/resources/{resource_id}.pdf"
        title = f"NCERT Resource {resource_id}"
    else:
        pdf_url = resource.external_url
        title = resource.title

    from app.db.session import SessionLocal
    background_tasks.add_task(
        background_ingest_resource_pdf,
        resource_id,
        pdf_url,
        title,
        SessionLocal
    )

    return StandardResponse.success_response(
        data={"resource_id": resource_id, "status": "processing"},
        message="PDF ingestion and embedding generation started in background."
    )
