from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse, MetaSchema
from app.models.resources import Resource, ResourceType, ResourceSource
from app.middlewares.auth_middleware import get_current_user, require_roles
from app.models.auth import User

router = APIRouter()


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
