from typing import List, Optional
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.middlewares.auth_middleware import require_roles
from app.models.auth import User, VolunteerProfile, ApprovalStatus
from app.models.resources import Resource
from app.models.administration import ActivityLog
from app.services.notification_service import NotificationService

router = APIRouter()


class RejectVolunteerRequest(BaseModel):
    reason: str


@router.get("/dashboard", response_model=StandardResponse[dict])
def get_admin_dashboard_metrics(
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_resources = db.query(Resource).filter(Resource.verification_status == "approved").count()
    pending_resources = db.query(Resource).filter(Resource.verification_status == "pending").count()
    
    pending_volunteers = db.query(VolunteerProfile).filter(VolunteerProfile.approval_status == ApprovalStatus.PENDING.value).count()
    approved_volunteers = db.query(VolunteerProfile).filter(VolunteerProfile.approval_status == ApprovalStatus.APPROVED.value).count()

    metrics = {
        "total_users": total_users,
        "total_resources": total_resources,
        "pending_resources": pending_resources,
        "pending_volunteers": pending_volunteers,
        "approved_volunteers": approved_volunteers,
        "system_status": "healthy"
    }

    return StandardResponse.success_response(data=metrics, message="Admin metrics retrieved successfully.")


@router.get("/pending-volunteers", response_model=StandardResponse[List[dict]])
def get_pending_volunteers(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(VolunteerProfile)
    if status_filter:
        query = query.filter(VolunteerProfile.approval_status == status_filter.upper())
    else:
        query = query.filter(VolunteerProfile.approval_status == ApprovalStatus.PENDING.value)

    volunteers = query.order_by(VolunteerProfile.applied_at.desc()).all()
    data = [
        {
            "id": str(v.id),
            "user_id": str(v.user_id),
            "email": v.user.email if v.user else "",
            "full_name": v.user.profile.full_name if (v.user and v.user.profile) else "Applicant",
            "organization": v.organization or "Not Specified",
            "approval_status": v.approval_status,
            "applied_at": v.applied_at.isoformat() if v.applied_at else None,
            "expires_at": v.expires_at.isoformat() if v.expires_at else None,
            "rejection_reason": v.rejection_reason
        } for v in volunteers
    ]
    return StandardResponse.success_response(data=data, message="Volunteer applications retrieved.")


@router.post("/volunteers/{user_id}/approve", response_model=StandardResponse[dict])
def approve_volunteer(
    user_id: UUID,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    volunteer_user = db.query(User).filter(User.id == user_id).first()
    if not volunteer_user or not volunteer_user.volunteer_profile:
        raise HTTPException(status_code=404, detail="Volunteer user not found")

    vp = volunteer_user.volunteer_profile
    vp.approval_status = ApprovalStatus.APPROVED.value
    vp.is_approved = True
    vp.approved_at = datetime.now(timezone.utc)
    vp.approved_by = current_user.id

    log = ActivityLog(
        user_id=current_user.id,
        action="VOLUNTEER_APPROVE",
        details={"volunteer_id": str(user_id), "email": volunteer_user.email}
    )
    db.add(log)
    db.commit()

    NotificationService.notify_volunteer_approved(volunteer_user)

    return StandardResponse.success_response(
        data={"user_id": str(user_id), "status": "APPROVED"},
        message="Volunteer account approved successfully."
    )


@router.post("/volunteers/{user_id}/reject", response_model=StandardResponse[dict])
def reject_volunteer(
    user_id: UUID,
    req: RejectVolunteerRequest,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    volunteer_user = db.query(User).filter(User.id == user_id).first()
    if not volunteer_user or not volunteer_user.volunteer_profile:
        raise HTTPException(status_code=404, detail="Volunteer user not found")

    vp = volunteer_user.volunteer_profile
    vp.approval_status = ApprovalStatus.REJECTED.value
    vp.is_approved = False
    vp.rejected_at = datetime.now(timezone.utc)
    vp.rejection_reason = req.reason.strip()

    log = ActivityLog(
        user_id=current_user.id,
        action="VOLUNTEER_REJECT",
        details={"volunteer_id": str(user_id), "reason": req.reason}
    )
    db.add(log)
    db.commit()

    NotificationService.notify_volunteer_rejected(volunteer_user, req.reason)

    return StandardResponse.success_response(
        data={"user_id": str(user_id), "status": "REJECTED"},
        message="Volunteer account rejected."
    )
