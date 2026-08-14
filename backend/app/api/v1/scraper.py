from typing import List, Optional, Any, Dict
from datetime import datetime, timezone
from uuid import UUID
import uuid
import httpx
import logging
import queue
import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.middlewares.auth_middleware import require_roles
from app.models.auth import User
from app.models.administration import ScraperSource, ScraperJob, ActivityLog
from app.models.resources import Resource
import enum

class ScraperType(str, enum.Enum):
    ncert = "ncert"
    kvs = "kvs"

router = APIRouter()

scraper_log_queue = queue.Queue()
scraper_lock = asyncio.Lock()

class QueueLogHandler(logging.Handler):
    def emit(self, record):
        try:
            msg = self.format(record)
            # Only keep the last 500 logs to prevent memory leak if no client connects
            if scraper_log_queue.qsize() > 500:
                try: scraper_log_queue.get_nowait()
                except queue.Empty: pass
            scraper_log_queue.put({"msg": msg, "level": record.levelname})
        except Exception:
            self.handleError(record)

scraper_logger = logging.getLogger("samidha.scrapers")
q_handler = QueueLogHandler()
q_handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S'))
scraper_logger.addHandler(q_handler)
scraper_logger.setLevel(logging.INFO)

@router.get("/logs/stream")
async def stream_scraper_logs():
    # Stream the logs using SSE. No auth dependency applied here since EventSource in browser doesn't send auth headers easily without extra work, but in production we'd use a token query param.
    async def event_generator():
        # Keep connection alive
        yield {"data": json.dumps({"msg": "Terminal connection established...", "level": "INFO"})}
        while True:
            try:
                log = scraper_log_queue.get_nowait()
                yield {"data": json.dumps(log)}
            except queue.Empty:
                await asyncio.sleep(0.5)
    return EventSourceResponse(event_generator())


class TriggerScraperRequest(BaseModel):
    scraper_type: ScraperType
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


def run_kvs_scraper_job(job_id: UUID, target_class: str):
    from app.db.session import SessionLocal
    from app.services.kvs_ingestion_service import KVSIngestionService
    db = SessionLocal()
    try:
        result = KVSIngestionService.sync_kvs_metadata(db, target_class_filter=target_class)
        telemetry = result.get("telemetry", {})
        scraped_sheet = result.get("scraped_sheet", [])
        
        job = db.query(ScraperJob).filter(ScraperJob.id == job_id).first()
        if job:
            job.status = "completed"
            job.class_code = target_class or "ALL"
            job.total_subjects_found = 0
            job.total_chapters_found = telemetry.get("total_processed", 0)
            job.scraped_success_count = telemetry.get("imported", 0) + telemetry.get("updated", 0)
            job.scraped_failed_count = telemetry.get("failed", 0)
            job.resources_found = telemetry.get("total_processed", 0)
            job.resources_added = telemetry.get("imported", 0)
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


SCRAPER_REGISTRY = {
    ScraperType.ncert: {
        "runner": run_ncert_scraper_job,
        "display_name": "NCERT Official Metadata Scraper",
        "supports_class_filter": True,
    },
    ScraperType.kvs: {
        "runner": run_kvs_scraper_job,
        "display_name": "KVS Knowledge Hub Scraper",
        "supports_class_filter": False,
    },
}

async def run_scraper_job_queued(job_id: UUID, target_class: str, scraper_type: ScraperType):
    """Wrapper to queue scraper jobs sequentially using a global lock to prevent OOM on low-RAM servers."""
    async with scraper_lock:
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            job = db.query(ScraperJob).filter(ScraperJob.id == job_id).first()
            if job and job.status == "pending":
                job.status = "running"
                db.commit()
            elif not job:
                return
        except Exception:
            pass
        finally:
            db.close()
            
        runner = SCRAPER_REGISTRY.get(scraper_type, {}).get("runner")
        if runner:
            await asyncio.to_thread(runner, job_id, target_class)

@router.post("/trigger", response_model=StandardResponse[dict])
def trigger_external_scraper(
    req: TriggerScraperRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_roles(["super_admin", "admin"])),
    db: Session = Depends(get_db)
):
    # Prevent duplicate running or pending jobs for the same class (only if it supports class filter)
    # If it doesn't support class filter, prevent ANY duplicate running job for that source
    registry_meta = SCRAPER_REGISTRY.get(req.scraper_type)
    if not registry_meta:
        raise HTTPException(status_code=400, detail="Invalid scraper type.")
        
    query = db.query(ScraperJob).filter(ScraperJob.status.in_(["running", "pending"]))
    if registry_meta["supports_class_filter"]:
        query = query.filter(ScraperJob.class_code == req.target_class)
    else:
        query = query.filter(ScraperJob.source_id == db.query(ScraperSource.id).filter(ScraperSource.source_name == registry_meta["display_name"]).scalar_subquery())
        
    active_job = query.first()

    if active_job:
        raise HTTPException(status_code=400, detail=f"A scraper job is already {active_job.status} for this configuration.")

    source_display_name = registry_meta["display_name"]
    # Find or create ScraperSource
    source = db.query(ScraperSource).filter(ScraperSource.source_name == source_display_name).first()
    if not source:
        source = ScraperSource(
            source_name=source_display_name,
            base_url=req.external_scraper_url or "https://ncert.nic.in"
        )
        db.add(source)
        db.flush()

    source.last_run_at = datetime.now(timezone.utc)

    # Create ScraperJob record
    job = ScraperJob(
        source_id=source.id,
        status="pending",
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
            "scraper_type": req.scraper_type.value,
            "target_class": req.target_class,
            "subject": req.subject_name,
            "max_items": req.max_items
        }
    )
    db.add(log)
    db.commit()

    # Launch scraper execution job in the sequential queue
    background_tasks.add_task(run_scraper_job_queued, job.id, req.target_class, req.scraper_type)

    request_payload = {
        "job_id": str(job.id),
        "scraper_type": req.scraper_type.value,
        "target_class": req.target_class,
        "subject_name": req.subject_name,
        "max_items": req.max_items,
        "callback_url": "https://samidha-e-guru.onrender.com/api/v1/scraper/webhook-callback"
    }

    return StandardResponse.success_response(
        data={
            "job_id": str(job.id),
            "status": "PENDING",
            "scraper_type": req.scraper_type.value,
            "source_name": source_display_name,
            "target_class": req.target_class,
            "subject_name": req.subject_name,
            "request_payload": request_payload
        },
        message=f"{source_display_name} Job #{str(job.id)[:8]} launched!"
    )


@router.get("/capabilities", response_model=StandardResponse[List[dict]])
def get_scraper_capabilities(current_user: User = Depends(require_roles(["super_admin", "admin"]))):
    capabilities = []
    for s_type, meta in SCRAPER_REGISTRY.items():
        capabilities.append({
            "type": s_type.value,
            "display_name": meta["display_name"],
            "supports_class_filter": meta["supports_class_filter"]
        })
    return StandardResponse.success_response(data=capabilities, message="Capabilities retrieved")


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
    
    # Check for jobs that have been stuck in 'running' for more than 5 minutes and mark them as failed
    for j in jobs:
        if j.status == "running":
            created_at = j.created_at
            if created_at is not None:
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                if (now_utc - created_at).total_seconds() > 300:  # 5 minutes timeout
                    j.status = "failed"
                    j.error_log = "Job timed out."
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
