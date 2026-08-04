from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse, MetaSchema
from app.models.resources import Resource, ResourceType, ResourceSource
from app.middlewares.auth_middleware import get_current_user, require_approved_volunteer
from app.models.auth import User

router = APIRouter()


class CreateResourceRequest(BaseModel):
    title: str
    description: Optional[str] = None
    external_url: str
    thumbnail_url: Optional[str] = None


@router.get("", response_model=StandardResponse[List[dict]])
def get_resources(
    chapter_id: Optional[UUID] = Query(None),
    resource_type_id: Optional[UUID] = Query(None),
    resource_source_id: Optional[UUID] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Resource).filter(Resource.verification_status == "approved")

    if chapter_id:
        query = query.filter(Resource.chapter_id == chapter_id)
    if resource_type_id:
        query = query.filter(Resource.resource_type_id == resource_type_id)
    if resource_source_id:
        query = query.filter(Resource.resource_source_id == resource_source_id)
    if search:
        query = query.filter(Resource.title.ilike(f"%{search}%"))

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
            "verification_status": resource.verification_status,
            "created_at": resource.created_at.isoformat()
        },
        message="Resource submitted successfully for admin review."
    )


@router.get("/{id}", response_model=StandardResponse[dict])
def get_resource_by_id(id: UUID, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == id, Resource.verification_status == "approved").first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    
    # Increment view count
    resource.views_count += 1
    db.commit()

    data = {
        "id": str(resource.id),
        "title": resource.title,
        "description": resource.description,
        "thumbnail_url": resource.thumbnail_url,
        "external_url": resource.external_url,
        "views_count": resource.views_count,
        "bookmarks_count": resource.bookmarks_count,
        "created_at": resource.created_at.isoformat()
    }
    return StandardResponse.success_response(data=data, message="Resource details retrieved.")
