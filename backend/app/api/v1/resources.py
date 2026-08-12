from typing import Optional, List
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse, MetaSchema
from app.models.resources import Resource, ResourceRating
from app.middlewares.auth_middleware import get_current_user, require_approved_volunteer
from app.models.auth import User

router = APIRouter()


class CreateResourceRequest(BaseModel):
    title: str
    description: Optional[str] = None
    external_url: str
    target_class: Optional[str] = None
    subject_name: Optional[str] = None
    resource_category: Optional[str] = None
    thumbnail_url: Optional[str] = None


class RateResourceRequest(BaseModel):
    stars: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = None


@router.get("", response_model=StandardResponse[List[dict]])
def get_resources(
    source_type: Optional[str] = Query(None),
    target_class: Optional[str] = Query(None),
    subject_name: Optional[str] = Query(None),
    resource_category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("latest"), # latest, top_rated, most_viewed
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=5000),
    db: Session = Depends(get_db)
):
    query = db.query(Resource).filter(Resource.verification_status == "approved")

    if source_type:
        query = query.filter(Resource.source_type == source_type)
    if target_class:
        query = query.filter(Resource.target_class == target_class)
    if subject_name:
        query = query.filter(Resource.subject_name.ilike(f"%{subject_name}%"))
    if resource_category:
        query = query.filter(Resource.resource_category == resource_category)
    if search:
        query = query.filter(Resource.title.ilike(f"%{search}%"))

    # Sorting
    if sort_by == "top_rated":
        query = query.order_by(Resource.rating_avg.desc(), Resource.created_at.desc())
    elif sort_by == "most_viewed":
        query = query.order_by(Resource.views_count.desc(), Resource.created_at.desc())
    else:
        query = query.order_by(Resource.created_at.desc())

    total_items = query.count()
    offset = (page - 1) * limit
    resources = query.offset(offset).limit(limit).all()

    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 0

    data = [
        {
            "id": str(r.id),
            "title": r.title,
            "description": r.description,
            "thumbnail_url": r.thumbnail_url,
            "external_url": r.external_url,
            "target_class": r.target_class,
            "subject_name": r.subject_name,
            "resource_category": r.resource_category,
            "source_type": r.source_type,
            "uploader_name": r.uploader.profile.full_name if (r.uploader and r.uploader.profile) else "SAMIDHA Contributor",
            "uploader_role": r.uploader.role.name if r.uploader else "volunteer",
            "rating_avg": round(r.rating_avg, 1),
            "rating_count": r.rating_count,
            "views_count": r.views_count,
            "bookmarks_count": r.bookmarks_count,
            "created_at": r.created_at.isoformat()
        } for r in resources
    ]

    meta = MetaSchema(
        page=page,
        limit=limit,
        total_items=total_items,
        total_pages=total_pages
    )

    return StandardResponse.success_response(
        data=data,
        meta=meta,
        message="Resources fetched successfully."
    )


@router.get("/my-stats", response_model=StandardResponse[dict])
def get_volunteer_resource_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_resources = db.query(Resource).filter(Resource.uploader_id == current_user.id)
    
    total_uploaded = user_resources.count()
    approved_and_live = user_resources.filter(Resource.verification_status == "approved").count()
    pending_review = user_resources.filter(Resource.verification_status == "pending").count()

    stats = {
        "total_uploaded": total_uploaded,
        "approved_and_live": approved_and_live,
        "pending_review": pending_review
    }

    return StandardResponse.success_response(data=stats, message="Volunteer stats retrieved successfully.")


class RequestDeletionRequest(BaseModel):
    reason: str


@router.get("/my-uploads", response_model=StandardResponse[List[dict]])
def get_my_uploaded_resources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resources = db.query(Resource).filter(Resource.uploader_id == current_user.id).order_by(Resource.created_at.desc()).all()
    data = [
        {
            "id": str(r.id),
            "title": r.title,
            "description": r.description,
            "external_url": r.external_url,
            "target_class": r.target_class or "N/A",
            "subject_name": r.subject_name or "N/A",
            "resource_category": r.resource_category or "Notes",
            "verification_status": r.verification_status,
            "rejection_reason": r.rejection_reason,
            "deletion_reason": r.deletion_reason,
            "views_count": r.views_count,
            "rating_avg": round(r.rating_avg, 1),
            "created_at": r.created_at.isoformat()
        } for r in resources
    ]
    return StandardResponse.success_response(data=data, message="Volunteer uploaded resources retrieved.")


@router.post("/{id}/request-deletion", response_model=StandardResponse[dict])
def request_resource_deletion(
    id: UUID,
    req: RequestDeletionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == id, Resource.uploader_id == current_user.id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found or unauthorized")

    resource.verification_status = "deletion_pending"
    resource.deletion_reason = req.reason.strip()
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(id), "verification_status": "deletion_pending"},
        message="Deletion request submitted! Admin will review your deletion reason note."
    )


@router.post("", response_model=StandardResponse[dict])
def create_resource(
    req: CreateResourceRequest,
    current_user: User = Depends(require_approved_volunteer),
    db: Session = Depends(get_db)
):
    resource = Resource(
        title=req.title.strip(),
        description=req.description.strip() if req.description else None,
        external_url=req.external_url.strip(),
        target_class=req.target_class,
        subject_name=req.subject_name,
        resource_category=req.resource_category,
        source_type="samidha",
        thumbnail_url=req.thumbnail_url,
        uploader_id=current_user.id,
        verification_status="pending"
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    return StandardResponse.success_response(
        data={
            "id": str(resource.id),
            "title": resource.title,
            "target_class": resource.target_class,
            "subject_name": resource.subject_name,
            "resource_category": resource.resource_category,
            "verification_status": resource.verification_status,
            "created_at": resource.created_at.isoformat()
        },
        message="Resource submitted successfully for admin review."
    )


@router.post("/{id}/rate", response_model=StandardResponse[dict])
def rate_resource(
    id: UUID,
    req: RateResourceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    existing_rating = db.query(ResourceRating).filter(
        ResourceRating.resource_id == id,
        ResourceRating.user_id == current_user.id
    ).first()

    if existing_rating:
        delta = req.stars - existing_rating.stars
        existing_rating.stars = req.stars
        existing_rating.feedback = req.feedback.strip() if req.feedback else None
        resource.rating_sum += delta
    else:
        new_rating = ResourceRating(
            resource_id=id,
            user_id=current_user.id,
            stars=req.stars,
            feedback=req.feedback.strip() if req.feedback else None
        )
        db.add(new_rating)
        resource.rating_sum += req.stars
        resource.rating_count += 1

    resource.rating_avg = resource.rating_sum / resource.rating_count if resource.rating_count > 0 else 0.0
    db.commit()

    return StandardResponse.success_response(
        data={
            "resource_id": str(id),
            "user_stars": req.stars,
            "rating_avg": round(resource.rating_avg, 1),
            "rating_count": resource.rating_count
        },
        message="Thank you! Your rating and feedback have been recorded."
    )


@router.get("/{id}", response_model=StandardResponse[dict])
def get_resource_by_id(id: UUID, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == id, Resource.verification_status == "approved").first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    
    resource.views_count += 1
    db.commit()

    data = {
        "id": str(resource.id),
        "title": resource.title,
        "description": resource.description,
        "thumbnail_url": resource.thumbnail_url,
        "external_url": resource.external_url,
        "target_class": resource.target_class,
        "subject_name": resource.subject_name,
        "resource_category": resource.resource_category,
        "source_type": resource.source_type,
        "uploader_name": resource.uploader.profile.full_name if (resource.uploader and resource.uploader.profile) else "SAMIDHA Contributor",
        "uploader_role": resource.uploader.role.name if resource.uploader else "volunteer",
        "rating_avg": round(resource.rating_avg, 1),
        "rating_count": resource.rating_count,
        "views_count": resource.views_count,
        "bookmarks_count": resource.bookmarks_count,
        "created_at": resource.created_at.isoformat()
    }
    return StandardResponse.success_response(data=data, message="Resource details retrieved.")


@router.get("/pdf-proxy/stream")
async def stream_pdf_proxy(url: str):
    """
    High-speed PDF proxy endpoint: Downloads NCERT PDFs using desktop browser User-Agent 
    headers and streams bytes directly to frontend iframe, bypassing NCERT timeouts & CORS blocking.
    """
    if not url or not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid PDF URL parameter.")

    import httpx
    from fastapi.responses import StreamingResponse

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/pdf,*/*",
        "Referer": "https://ncert.nic.in/",
        "Origin": "https://ncert.nic.in"
    }

    try:
        client = httpx.AsyncClient(timeout=30.0, follow_redirects=True, headers=headers)
        req = client.build_request("GET", url)
        resp = await client.send(req, stream=True)
        
        return StreamingResponse(
            resp.aiter_bytes(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "inline",
                "Cache-Control": "public, max-age=86400"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not stream PDF from upstream server: {e}")
