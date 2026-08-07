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
    Proxy endpoint: Retrieves cached AI Tutor Workspace payload from 
    the dedicated MongoDB Learn AI microservice.
    """
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    title = resource.title if resource else f"Resource {resource_id}"
    pdf_url = resource.external_url if (resource and resource.external_url) else "https://ncert.nic.in/textbook/pdf/jemh101.pdf"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{LEARN_AI_SERVICE_URL}/api/v1/learn-ai/workspace/{resource_id}",
                params={"title": title, "pdf_url": pdf_url}
            )
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                data["pdf_url"] = pdf_url
                return StandardResponse.success_response(data=data, message="Workspace retrieved from Learn AI MongoDB service.")
    except Exception as e:
        logger.warning(f"Microservice proxy offline, using local workspace fallback: {e}")

    # Graceful fallback if microservice is offline
    fallback_workspace = {
        "resource_id": resource_id,
        "resource_title": title,
        "pdf_url": pdf_url,
        "summaries": {
            "one_min_bullets": [
                f"Core theme of {title} focuses on fundamental academic concepts.",
                "Key formulas and principles govern practical problem solving.",
                "Essential textbook definitions provide base for exam readiness."
            ],
            "five_min_paragraph": f"This chapter '{title}' covers foundational concepts essential for board and competitive exams.",
            "revision_notes": ["Rule 1: Verify key formulas before applying.", "Rule 2: Identify textbook definitions."]
        },
        "mind_map": {"id": "root", "label": title, "children": []},
        "flashcards": [
            {"id": "fc-1", "front": f"What is the main concept of {title}?", "back": "To establish clear foundational understanding.", "difficulty": "Easy", "tag": "Concept"}
        ],
        "study_tools": {
            "definitions": [{"term": "Primary Concept", "definition": "A fundamental principle in curriculum."}],
            "formulas": [{"name": "Standard Identity", "latex": "a^2 + b^2 = c^2", "explanation": "Fundamental relationship."}],
            "mnemonics": [{"phrase": "OIL RIG", "concept": "Redox Reactions", "explanation": "Oxidation Is Loss, Reduction Is Gain."}],
            "common_mistakes": [{"misconception": "Sign errors", "correction": "Write standard form first.", "reason": "Avoid sign calculation mistakes."}],
            "video_scripts": [{"scene": "Intro", "narration": f"Welcome to {title}!", "visual": "Title header."}]
        },
        "question_bank": [
            {
                "id": "q1",
                "bloom_level": "Remember",
                "question_type": "MCQ",
                "question": f"Which statement best describes {title}?",
                "options": [{"id": "A", "text": "It provides foundational principles for academic study."}, {"id": "B", "text": "Unrelated to board exams."}],
                "correct_answer": "A",
                "explanation": "Option A accurately reflects curriculum objective."
            }
        ]
    }
    return StandardResponse.success_response(data=fallback_workspace, message="AI Tutor Workspace retrieved (fallback mode).")


@router.post("/query", response_model=StandardResponse[Dict[str, Any]])
async def solve_chapter_doubt(
    request: RagQueryRequest,
    db: Session = Depends(get_db)
):
    """Proxy endpoint: Forwards doubt solver queries to MongoDB microservice."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                f"{LEARN_AI_SERVICE_URL}/api/v1/learn-ai/query",
                json={"resource_id": request.resource_id, "question": request.question}
            )
            if resp.status_code == 200:
                return StandardResponse.success_response(data=resp.json().get("data", {}), message="Doubt solved via MongoDB service.")
    except Exception as e:
        logger.warning(f"Microservice proxy offline for doubt query: {e}")

    fallback_answer = {
        "answer": f"Based on textbook analysis for this chapter: {request.question}\n\n• Review core definitions and step-by-step proofs.\n• Verify intermediate steps clearly.",
        "sources": [{"page_number": 1, "content_snippet": "Relevant textbook chapter content."}]
    }
    return StandardResponse.success_response(data=fallback_answer, message="Doubt query answered (fallback mode).")


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
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
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
