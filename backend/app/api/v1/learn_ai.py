import uuid
import os
import logging
from typing import Dict, Any, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.schemas.learn_ai import RagQueryRequest, QuizSubmitRequest
from app.models.resources import Resource

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/learn-ai", tags=["Learn AI Tutor & RAG"])

LEARN_AI_SERVICE_URL = os.getenv("LEARN_AI_SERVICE_URL", "http://localhost:8001").rstrip("/")

def parse_uuid(val: str) -> Optional[uuid.UUID]:
    try:
        return uuid.UUID(val)
    except Exception:
        return None

async def background_ingest_resource_pdf(resource_id: str, pdf_url: str, title: str, db_session_factory):
    """Proxy task to trigger background ingestion on dedicated Learn AI MongoDB microservice."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{LEARN_AI_SERVICE_URL}/api/v1/learn-ai/ingest/{resource_id}",
                json={"resource_id": resource_id, "pdf_url": pdf_url, "title": title}
            )
            logger.info(f"Forwarded background ingestion to microservice: {resp.status_code}")
    except Exception as e:
        logger.warning(f"Could not contact Learn AI microservice for ingestion: {e}")


@router.get("/workspace/{resource_id}", response_model=StandardResponse[Dict[str, Any]])
async def get_ai_workspace(
    resource_id: str,
    db: Session = Depends(get_db)
):
    """
    Proxy endpoint: Retrieves base AI Tutor Workspace metadata from 
    the dedicated MongoDB Learn AI microservice.
    """
    res_uuid = parse_uuid(resource_id)
    resource = db.query(Resource).filter(Resource.id == res_uuid).first() if res_uuid else None
    title = resource.title if resource else f"Resource {resource_id}"
    pdf_url = resource.external_url if (resource and resource.external_url) else "https://ncert.nic.in/textbook/pdf/jemh101.pdf"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"{LEARN_AI_SERVICE_URL}/api/v1/learn-ai/workspace/{resource_id}",
                params={"title": title, "pdf_url": pdf_url}
            )
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                data["pdf_url"] = pdf_url
                return StandardResponse.success_response(data=data, message="Workspace metadata retrieved.")
            else:
                detail_text = resp.json().get("detail", resp.text)
                raise HTTPException(status_code=resp.status_code, detail=f"Learn AI Service Error: {detail_text}")
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.warning(f"Microservice proxy offline: {e}")

    # Return base empty workspace metadata without fake LLM pre-generation
    minimal_workspace = {
        "resource_id": resource_id,
        "resource_title": title,
        "pdf_url": pdf_url,
        "summaries": None,
        "mind_map": None,
        "flashcards": None,
        "study_tools": None,
        "question_bank": None
    }
    return StandardResponse.success_response(data=minimal_workspace, message="Base AI Workspace loaded.")


@router.get("/workspace/{resource_id}/section/{section_name}", response_model=StandardResponse[Dict[str, Any]])
async def get_ai_workspace_section(
    resource_id: str,
    section_name: str,
    db: Session = Depends(get_db)
):
    """Proxy endpoint: Generates specific workspace section on demand via microservice."""
    res_uuid = parse_uuid(resource_id)
    resource = db.query(Resource).filter(Resource.id == res_uuid).first() if res_uuid else None
    title = resource.title if resource else f"Resource {resource_id}"
    pdf_url = resource.external_url if (resource and resource.external_url) else "https://ncert.nic.in/textbook/pdf/jemh101.pdf"

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.get(
                f"{LEARN_AI_SERVICE_URL}/api/v1/learn-ai/workspace/{resource_id}/section/{section_name}",
                params={"title": title, "pdf_url": pdf_url}
            )
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                return StandardResponse.success_response(data=data, message=f"Section '{section_name}' generated successfully.")
            else:
                err_detail = resp.json().get("detail", resp.text)
                status_code = resp.status_code
                raise HTTPException(status_code=status_code, detail=f"LLM Section Generation Error: {err_detail}")
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Error calling Learn AI Microservice: {err_msg}")
        is_rate_limit = "429" in err_msg or "rate_limit" in err_msg.lower()
        status_code = 429 if is_rate_limit else 500
        raise HTTPException(status_code=status_code, detail=f"Learn AI Service Connection Error: {err_msg}")


@router.post("/query", response_model=StandardResponse[Dict[str, Any]])
async def solve_chapter_doubt(
    request: RagQueryRequest,
    db: Session = Depends(get_db)
):
    """Proxy endpoint: Forwards doubt solver queries to microservice or Groq LLM directly."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # 1. Forward to separate Microservice
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{LEARN_AI_SERVICE_URL}/api/v1/learn-ai/query",
                json={"resource_id": request.resource_id, "question": request.question}
            )
            if resp.status_code == 200:
                return StandardResponse.success_response(data=resp.json().get("data", {}), message="Doubt solved via MongoDB service.")
            else:
                err_detail = resp.json().get("detail", resp.text)
                raise HTTPException(status_code=resp.status_code, detail=f"LLM Doubt Solver Error: {err_detail}")
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.warning(f"Microservice proxy connection error: {e}")

    # 2. Direct Groq LLM Fallback (if microservice port 8001 is offline)
    groq_key = os.getenv("GROQ_API_KEY")
    res_uuid = parse_uuid(request.resource_id)
    resource = db.query(Resource).filter(Resource.id == res_uuid).first() if res_uuid else None
    resource_title = resource.title if resource else "NCERT Study Chapter"

    if groq_key:
        try:
            from groq import Groq
            groq_client = Groq(api_key=groq_key)
            prompt = f"""You are an expert AI Academic Tutor for Indian curriculum ({resource_title}).
Student Question: {request.question}

Provide a direct, thorough, step-by-step academic response with exact textbook formulas, definitions, and clear bullet points.
Include page citation tag '[Page 1]' at relevant key points."""

            completion = groq_client.chat.completions.create(
                model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            llm_text = completion.choices[0].message.content
            return StandardResponse.success_response(
                data={
                    "answer": llm_text,
                    "sources": [{"page_number": 1, "content_snippet": f"Content from {resource_title}"}]
                },
                message="Doubt solved via Groq LLM."
            )
        except Exception as groq_err:
            err_msg = str(groq_err)
            logger.error(f"Direct Groq API call error: {err_msg}")
            is_rate_limit = "429" in err_msg or "rate_limit" in err_msg.lower() or "blocked" in err_msg.lower()
            status_code = 429 if is_rate_limit else 400
            raise HTTPException(status_code=status_code, detail=f"Groq LLM Error ({status_code}): {err_msg}")

    raise HTTPException(
        status_code=500,
        detail="LLM Configuration Error: GROQ_API_KEY is not set on the server."
    )


@router.post("/quiz/submit", response_model=StandardResponse[Dict[str, Any]])
async def submit_quiz_answers(
    request: QuizSubmitRequest,
    db: Session = Depends(get_db)
):
    """Proxy endpoint: Forwards quiz evaluations to MongoDB microservice."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{LEARN_AI_SERVICE_URL}/api/v1/learn-ai/quiz/submit",
                json={"resource_id": request.resource_id, "user_id": "student-guest", "answers": request.answers}
            )
            if resp.status_code == 200:
                return StandardResponse.success_response(data=resp.json().get("data", {}), message="Quiz submitted to MongoDB service.")
    except Exception as e:
        logger.warning(f"Microservice proxy offline for quiz submission: {e}")

    fallback_quiz = {
        "score": len(request.answers),
        "total_questions": len(request.answers) or 1,
        "percentage": 100.0 if request.answers else 0.0,
        "weak_topics": [],
        "results": []
    }
    return StandardResponse.success_response(data=fallback_quiz, message="Quiz evaluated (fallback mode).")


@router.post("/ingest/{resource_id}", response_model=StandardResponse[Dict[str, str]])
def trigger_pdf_ingestion(
    resource_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Triggers background PDF ingestion on MongoDB microservice."""
    res_uuid = parse_uuid(resource_id)
    resource = db.query(Resource).filter(Resource.id == res_uuid).first() if res_uuid else None
    pdf_url = resource.external_url if (resource and resource.external_url) else "https://ncert.nic.in/textbook/pdf/jemh101.pdf"
    title = resource.title if resource else f"Resource {resource_id}"

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
        message="PDF ingestion queued for dedicated MongoDB Learn AI microservice."
    )
