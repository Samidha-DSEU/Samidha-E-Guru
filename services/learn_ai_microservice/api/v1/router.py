from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from pymongo.database import Database
from db.mongo import get_mongo_db
from services.rag_service import RAGService
from services.pdf_service import PDFIngestionService

router = APIRouter(prefix="/api/v1/learn-ai", tags=["Learn AI Microservice"])

class RagQueryRequest(BaseModel):
    resource_id: str
    question: str

class QuizSubmitRequest(BaseModel):
    resource_id: str
    user_id: Optional[str] = "student-guest"
    answers: Dict[str, str]

class IngestPdfRequest(BaseModel):
    resource_id: str
    pdf_url: str
    title: str

@router.get("/workspace/{resource_id}")
def get_workspace(
    resource_id: str,
    title: Optional[str] = "NCERT Textbook Chapter",
    pdf_url: Optional[str] = "https://ncert.nic.in/textbook/pdf/jemh101.pdf",
    db: Database = Depends(get_mongo_db)
):
    """Retrieve workspace from MongoDB Atlas."""
    workspace = RAGService.get_or_generate_workspace(db, resource_id, title, pdf_url)
    return {
        "success": True,
        "message": "Workspace retrieved from MongoDB Atlas.",
        "data": workspace
    }

@router.post("/query")
def solve_doubt(
    request: RagQueryRequest,
    db: Database = Depends(get_mongo_db)
):
    """RAG Doubt Solver using MongoDB vector search."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    result = RAGService.solve_doubt(db, request.resource_id, request.question)
    return {
        "success": True,
        "message": "Doubt query solved successfully.",
        "data": result
    }

@router.post("/quiz/submit")
def submit_quiz(
    request: QuizSubmitRequest,
    db: Database = Depends(get_mongo_db)
):
    """Grade quiz and log progress in MongoDB."""
    result = RAGService.grade_quiz(db, request.resource_id, request.user_id, request.answers)
    return {
        "success": True,
        "message": "Quiz submitted and progress logged in MongoDB.",
        "data": result
    }

@router.post("/ingest/{resource_id}")
async def trigger_ingestion(
    resource_id: str,
    payload: IngestPdfRequest,
    background_tasks: BackgroundTasks,
    db: Database = Depends(get_mongo_db)
):
    """Triggers background PDF parsing and MongoDB vector storage."""
    background_tasks.add_task(
        PDFIngestionService.ingest_resource_pdf,
        db,
        resource_id,
        payload.pdf_url,
        payload.title
    )
    return {
        "success": True,
        "message": f"Background PDF ingestion queued for resource {resource_id} in MongoDB Atlas.",
        "data": {"resource_id": resource_id, "status": "processing"}
    }
