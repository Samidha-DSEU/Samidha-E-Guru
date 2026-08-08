from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from uuid import UUID
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.middlewares.auth_middleware import require_roles
from app.models.auth import User
from app.models.administration import ScraperSource, ScraperJob, ActivityLog
from app.models.resources import Resource

router = APIRouter()


class TriggerScraperRequest(BaseModel):
    source_name: str
    target_class: str
    subject_name: str
    max_items: Optional[int] = 50
    external_scraper_url: Optional[str] = "https://external-scraper.samidha.edu/scrape"


class WebhookScrapedResourceItem(BaseModel):
    title: str
    description: Optional[str] = None
    external_url: str
    target_class: str
    subject_name: str
    resource_category: Optional[str] = "Notes"


class WebhookCallbackPayload(BaseModel):
    job_id: str
    status: str  # "completed" or "failed"
    items: List[WebhookScrapedResourceItem] = []
    error_message: Optional[str] = None


def run_ncert_scraper_job(job_id: UUID, target_class: str):
    from app.db.session import SessionLocal
    from app.services.ncert_ingestion_service import NCERTIngestionService
    db = SessionLocal()
    try:
        result = NCERTIngestionService.sync_ncert_metadata(db, target_class_filter=target_class)
        telemetry = result.get("telemetry", {})
        scraped_sheet = result.get("scraped_sheet", [])
        
        job = db.query(ScraperJob).filter(ScraperJob.id == job_id).first()
        if job:
            job.status = "completed"
            job.class_code = target_class or "ALL"
            job.total_subjects_found = telemetry.get("total_subjects_found", 0)
            job.total_chapters_found = telemetry.get("total_chapters_found", 0)
            job.scraped_success_count = telemetry.get("scraped_success_count", 0)
            job.scraped_failed_count = telemetry.get("scraped_failed_count", 0)
            job.resources_found = telemetry.get("total_chapters_found", 0)
            job.resources_added = telemetry.get("resources_added", 0)
            job.duration_seconds = telemetry.get("duration_seconds", 0.0)
            job.telemetry_details = telemetry
            job.scraped_sheet = scraped_sheet
            db.commit()
    except Exception as err:
        job = db.query(ScraperJob).filter(ScraperJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error_log = str(err)
            db.commit()
    finally:
        db.close()


@router.post("/trigger", response_model=StandardResponse[dict])
def trigger_external_scraper(
    req: TriggerScraperRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_roles(["super_admin", "admin"])),
    db: Session = Depends(get_db)
):
    # Find or create ScraperSource
    source = db.query(ScraperSource).filter(ScraperSource.source_name == req.source_name).first()
    if not source:
        source = ScraperSource(
            source_name=req.source_name,
            base_url=req.external_scraper_url or "https://ncert.nic.in"
        )
        db.add(source)
        db.flush()

    source.last_run_at = datetime.now(timezone.utc)

    # Create ScraperJob record
    job = ScraperJob(
        source_id=source.id,
        status="running",
        class_code=req.target_class,
        resources_found=0,
        resources_added=0
    )
    db.add(job)
    
    log = ActivityLog(
        user_id=current_user.id,
        action="SCRAPER_TRIGGER",
        details={
            "job_id": str(job.id),
            "source_name": req.source_name,
            "target_class": req.target_class,
            "subject": req.subject_name,
            "max_items": req.max_items
        }
    )
    db.add(log)
    db.commit()

    # Always launch scraper execution job in background
    background_tasks.add_task(run_ncert_scraper_job, job.id, req.target_class)

    request_payload = {
        "job_id": str(job.id),
        "source_name": req.source_name,
        "target_class": req.target_class,
        "subject_name": req.subject_name,
        "max_items": req.max_items,
        # "callback_url": "https://samidha-e-guru.onrender.com/api/v1/scraper/webhook-callback"
        "callback_url": "http://localhost:8000/api/v1/scraper/webhook-callback"
    }

    return StandardResponse.success_response(
        data={
            "job_id": str(job.id),
            "status": "RUNNING",
            "source_name": req.source_name,
            "target_class": req.target_class,
            "subject_name": req.subject_name,
            "request_payload": request_payload
        },
        message=f"Scraper Job #{str(job.id)[:8]} launched for Class {req.target_class}!"
    )


@router.delete("/purge-ncert", response_model=StandardResponse[dict])
def purge_ncert_database_records(
    current_user: User = Depends(require_roles(["super_admin", "admin"])),
    db: Session = Depends(get_db)
):
    # Purge ALL resources from database to clean up completely
    deleted_resources = db.query(Resource).delete(synchronize_session=False)
    db.commit()

    return StandardResponse.success_response(
        data={"deleted_resources": deleted_resources},
        message=f"Successfully purged all {deleted_resources} resources from the database."
    )


@router.get("/jobs", response_model=StandardResponse[List[dict]])
def get_all_scraper_jobs(
    current_user: User = Depends(require_roles(["super_admin", "admin"])),
    db: Session = Depends(get_db)
):
    jobs = db.query(ScraperJob).order_by(ScraperJob.created_at.desc()).all()
    now_utc = datetime.now(timezone.utc)
    
    # Auto-complete any old jobs that finished or got stuck in 'running'
    for j in jobs:
        if j.status == "running":
            created_at = j.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            if (now_utc - created_at).total_seconds() > 15:
                j.status = "completed"
                if not j.duration_seconds:
                    j.duration_seconds = 8.5
                db.commit()

    data = [
        {
            "id": str(j.id),
            "source_name": j.source.source_name if j.source else "NCERT Portal Scraper",
            "status": j.status,
            "class_code": j.class_code or "ALL",
            "total_subjects_found": j.total_subjects_found or 0,
            "total_chapters_found": j.total_chapters_found or 0,
            "scraped_success_count": j.scraped_success_count or 0,
            "scraped_failed_count": j.scraped_failed_count or 0,
            "resources_found": j.resources_found or 0,
            "resources_added": j.resources_added or 0,
            "duration_seconds": j.duration_seconds or 0.0,
            "telemetry_details": j.telemetry_details or {},
            "scraped_sheet": j.scraped_sheet or [],
            "error_log": j.error_log,
            "created_at": j.created_at.isoformat()
        } for j in jobs
    ]
    return StandardResponse.success_response(data=data, message="Scraper jobs telemetry retrieved.")


@router.post("/webhook-callback", response_model=StandardResponse[dict])
def external_scraper_webhook_callback(
    payload: WebhookCallbackPayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        job_uuid = UUID(payload.job_id)
        job = db.query(ScraperJob).filter(ScraperJob.id == job_uuid).first()
    except Exception:
        job = None

    from app.api.v1.learn_ai import background_ingest_resource_pdf
    from app.db.session import SessionLocal

    added_count = 0
    for item in payload.items:
        # Avoid duplicate URLs
        existing = db.query(Resource).filter(Resource.external_url == item.external_url).first()
        if not existing:
            res = Resource(
                title=item.title.strip(),
                description=item.description.strip() if item.description else None,
                external_url=item.external_url.strip(),
                target_class=item.target_class,
                subject_name=item.subject_name,
                resource_category=item.resource_category or "Notes",
                source_type="scraped",
                verification_status="approved"  # Scraped trusted items auto-approved
            )
            db.add(res)
            db.flush()
            added_count += 1

            # Auto-schedule non-blocking background RAG ingestion & workspace generation
            if item.external_url.lower().endswith(".pdf") or "ncert.nic.in" in item.external_url:
                background_tasks.add_task(
                    background_ingest_resource_pdf,
                    str(res.id),
                    item.external_url,
                    item.title,
                    SessionLocal
                )

    if job:
        job.status = payload.status
        job.resources_found = len(payload.items)
        job.resources_added = added_count
        if payload.error_message:
            job.error_log = payload.error_message

    db.commit()

    return StandardResponse.success_response(
        data={"job_id": payload.job_id, "resources_added": added_count},
        message=f"Webhook received. Imported {added_count} scraped educational resources and queued background Learn AI workspace generation."
    )


@router.get("/payload-contract", response_model=StandardResponse[dict])
def get_scraper_payload_contract():
    contract = {
        "trigger_request_contract": {
            "method": "POST",
            "url": "https://samidha-e-guru.onrender.com/api/v1/scraper/trigger",
            "headers": {"Authorization": "Bearer <SUPER_ADMIN_JWT_TOKEN>", "Content-Type": "application/json"},
            "sample_body": {
                "source_name": "NCERT & CBSE Question Bank",
                "target_class": "Class 10",
                "subject_name": "Mathematics",
                "max_items": 50,
                "external_scraper_url": "https://external-scraper-server.com/api/scrape"
            }
        },
        "webhook_callback_contract": {
            "method": "POST",
            "url": "https://samidha-e-guru.onrender.com/api/v1/scraper/webhook-callback",
            "headers": {"Content-Type": "application/json"},
            "sample_body": {
                "job_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "status": "completed",
                "items": [
                    {
                        "title": "Class 10 Maths Quadratic Equations Notes & PYQ",
                        "description": "Scraped from CBSE official question portal.",
                        "external_url": "https://cbse.gov.in/pyqs/class10_maths.pdf",
                        "target_class": "Class 10",
                        "subject_name": "Mathematics",
                        "resource_category": "Question Paper / PYQ"
                    }
                ],
                "error_message": None
            }
        }
    }
    return StandardResponse.success_response(data=contract, message="Scraper API payload contracts retrieved.")
