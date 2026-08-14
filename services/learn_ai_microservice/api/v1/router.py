import os
import logging
import httpx
from typing import Dict, Any, Optional, List, Tuple
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pymongo.database import Database
from db.mongo import get_mongo_db
from services.rag_service import RAGService
from services.pdf_service import PDFIngestionService
from services.chatpdf_service import chatpdf_service
from schemas.learn_ai import (
    RagQueryRequest, 
    QuizSubmitRequest,
    RagQueryResponse,
    SourceCitation,
    QuizSubmitResponse,
    AIWorkspacePayload
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/learn-ai", tags=["Learn AI Microservice"])

MAIN_BACKEND_URL = os.getenv("MAIN_BACKEND_URL", "https://samidha-e-guru.onrender.com/api/v1")

def fetch_resource_details_sync(resource_id: str) -> Tuple[str, str]:
    """Securely fetches verified resource metadata synchronously."""
    try:
        response = httpx.get(f"{MAIN_BACKEND_URL}/resources/{resource_id}", timeout=10.0)
        if response.status_code == 200:
            data = response.json().get("data", {})
            return data.get("title", "Study Material"), data.get("external_url", "")
    except Exception as e:
        logger.error(f"Error fetching resource details sync: {e}")
    return "Study Material", "https://ncert.nic.in/textbook/pdf/jemh101.pdf"

async def fetch_resource_details_async(resource_id: str) -> Tuple[str, str]:
    """Securely fetches verified resource metadata asynchronously."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MAIN_BACKEND_URL}/resources/{resource_id}", timeout=10.0)
            if response.status_code == 200:
                data = response.json().get("data", {})
                return data.get("title", "Study Material"), data.get("external_url", "")
    except Exception as e:
        logger.error(f"Error fetching resource details async: {e}")
    return "Study Material", "https://ncert.nic.in/textbook/pdf/jemh101.pdf"

@router.get("/workspace/{resource_id}")
def get_workspace(
    resource_id: str,
    db: Database = Depends(get_mongo_db)
):
    """Retrieve base workspace metadata from MongoDB Atlas."""
    title, pdf_url = fetch_resource_details_sync(resource_id)
    workspace = RAGService.get_or_generate_workspace(db, resource_id, title, pdf_url)
    return {
        "success": True,
        "message": "Workspace retrieved from MongoDB Atlas.",
        "data": workspace
    }

@router.get("/workspace/{resource_id}/section/{section_name}")
def get_workspace_section(
    resource_id: str,
    section_name: str,
    db: Database = Depends(get_mongo_db)
):
    """On-demand section workspace generation via Groq LLM."""
    try:
        title, pdf_url = fetch_resource_details_sync(resource_id)
        data = RAGService.generate_workspace_section(db, resource_id, section_name, title, pdf_url)
        return {
            "success": True,
            "message": f"Workspace section '{section_name}' generated successfully.",
            "data": data
        }
    except ValueError as val_err:
        err_msg = str(val_err)
        status_code = 429 if "429" in err_msg or "Rate Limit" in err_msg else 400
        raise HTTPException(status_code=status_code, detail=err_msg)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LLM Section Generation Error: {str(exc)}")

@router.post("/query")
async def solve_doubt(
    request: RagQueryRequest,
    db: Database = Depends(get_mongo_db)
):
    """RAG Doubt Solver using ChatPDF (primary) and MongoDB vector search (fallback)."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    resource_title, pdf_url = await fetch_resource_details_async(request.resource_id)

    # 1. Try ChatPDF
    if chatpdf_service.is_configured() and pdf_url:
        try:
            source_id = await chatpdf_service.add_pdf_by_url(pdf_url)
            if source_id:
                chat_res = await chatpdf_service.query_document(source_id, request.question)
                if chat_res.get("rate_limited"):
                    raise HTTPException(
                        status_code=429,
                        detail=chat_res.get("answer", "⚡ ChatPDF request quota limit reached. Please wait 60s.")
                    )
                if chat_res.get("status") == "success":
                    raw_refs = chat_res.get("references", [])
                    sources = [
                        {"page_number": ref.get("pageNumber", 1), "content_snippet": ref.get("text", f"Page {ref.get('pageNumber', 1)}")}
                        for ref in raw_refs
                    ] or [{"page_number": 1, "content_snippet": f"Document context from {resource_title}"}]

                    return {
                        "success": True,
                        "message": "Doubt solved via ChatPDF API.",
                        "data": {
                            "answer": chat_res.get("answer"),
                            "sources": sources,
                            "provider": "ChatPDF API"
                        }
                    }
        except HTTPException as http_exc:
            raise http_exc
        except Exception as chatpdf_err:
            logger.warning(f"ChatPDF service query error, falling back: {chatpdf_err}")

    # 2. Fallback to Microservice MongoDB RAG
    try:
        result = RAGService.solve_doubt(db, request.resource_id, request.question)
        result["provider"] = "Groq LLM (MongoDB RAG)"
        return {
            "success": True,
            "message": "Doubt query solved successfully.",
            "data": result
        }
    except ValueError as val_err:
        err_msg = str(val_err)
        status_code = 429 if "429" in err_msg or "Rate Limit" in err_msg else 400
        raise HTTPException(status_code=status_code, detail=err_msg)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LLM Doubt Solver Error: {str(exc)}")

@router.post("/quiz/submit")
def submit_quiz(
    request: QuizSubmitRequest,
    db: Database = Depends(get_mongo_db)
):
    """Grade quiz and log progress in MongoDB."""
    user_id = "student-guest" # Can be updated when microservice implements proper auth
    result = RAGService.grade_quiz(db, request.resource_id, user_id, request.answers)
    return {
        "success": True,
        "message": "Quiz submitted and progress logged in MongoDB.",
        "data": result
    }

@router.post("/ingest/{resource_id}")
async def trigger_ingestion(
    resource_id: str,
    background_tasks: BackgroundTasks,
    db: Database = Depends(get_mongo_db)
):
    """Triggers background PDF parsing and MongoDB vector storage."""
    title, pdf_url = await fetch_resource_details_async(resource_id)
    if not pdf_url:
        raise HTTPException(status_code=400, detail="Resource does not have a valid PDF URL.")

    background_tasks.add_task(
        PDFIngestionService.ingest_resource_pdf,
        db,
        resource_id,
        pdf_url,
        title
    )
    return {
        "success": True,
        "message": f"Background PDF ingestion queued for resource {resource_id} in MongoDB Atlas.",
        "data": {"resource_id": resource_id, "status": "processing"}
    }
