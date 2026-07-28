from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.middlewares.auth_middleware import require_roles
from app.models.auth import User
from app.models.resources import Resource
from app.models.administration import ActivityLog

router = APIRouter()


@router.get("/dashboard", response_model=StandardResponse[dict])
def get_admin_dashboard_metrics(
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_resources = db.query(Resource).filter(Resource.verification_status == "approved").count()
    pending_resources = db.query(Resource).filter(Resource.verification_status == "pending").count()

    metrics = {
        "total_users": total_users,
        "total_resources": total_resources,
        "pending_resources": pending_resources,
        "system_status": "healthy"
    }

    return StandardResponse.success_response(data=metrics, message="Admin metrics retrieved successfully.")


@router.get("/pending-resources", response_model=StandardResponse[List[dict]])
def get_pending_resources(
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    pending = db.query(Resource).filter(Resource.verification_status == "pending").all()
    data = [
        {
            "id": str(r.id),
            "title": r.title,
            "external_url": r.external_url,
            "created_at": r.created_at.isoformat()
        } for r in pending
    ]
    return StandardResponse.success_response(data=data, message="Pending resources list retrieved.")


@router.patch("/pending-resources/{id}/approve", response_model=StandardResponse[dict])
def approve_pending_resource(
    id: UUID,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    
    resource.verification_status = "approved"
    
    # Record activity log
    log = ActivityLog(
        user_id=current_user.id,
        action="RESOURCE_APPROVE",
        details={"resource_id": str(id), "title": resource.title}
    )
    db.add(log)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(id), "status": "approved"},
        message="Resource approved successfully."
    )
