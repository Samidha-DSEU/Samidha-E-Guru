import time
from typing import List, Optional
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.middlewares.auth_middleware import require_roles
from app.models.auth import User, VolunteerProfile, ApprovalStatus, Role
from app.models.resources import Resource
from app.models.events import Event
from app.models.administration import ActivityLog
from app.services.notification_service import NotificationService

router = APIRouter()


class RejectRequest(BaseModel):
    reason: str


class UpdateRoleRequest(BaseModel):
    assigned_role: str


class FeatureMentorRequest(BaseModel):
    is_featured_mentor: bool


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


class AssignRoleRequest(BaseModel):
    assigned_role: str

@router.post("/volunteers/{user_id}/assign-role", response_model=StandardResponse[dict])
def assign_volunteer_role(
    user_id: UUID,
    req: AssignRoleRequest,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    volunteer_user = db.query(User).filter(User.id == user_id).first()
    if not volunteer_user or not volunteer_user.volunteer_profile:
        raise HTTPException(status_code=404, detail="Volunteer user not found")

    vp = volunteer_user.volunteer_profile
    vp.assigned_role = req.assigned_role.strip()
    
    log = ActivityLog(
        user_id=current_user.id,
        action="VOLUNTEER_ASSIGN_ROLE",
        details={"volunteer_id": str(user_id), "assigned_role": vp.assigned_role}
    )
    db.add(log)
    db.commit()

    return StandardResponse.success_response(
        data={"user_id": str(user_id), "assigned_role": vp.assigned_role},
        message="Volunteer role assigned successfully."
    )


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
    req: RejectRequest,
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


@router.patch("/users/{user_id}/volunteer-role", response_model=StandardResponse[dict])
def update_volunteer_role(
    user_id: UUID,
    req: UpdateRoleRequest,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user or not target_user.volunteer_profile:
        raise HTTPException(status_code=404, detail="Volunteer not found.")
    
    target_user.volunteer_profile.assigned_role = req.assigned_role.strip()
    
    log = ActivityLog(
        user_id=current_user.id,
        action="UPDATE_VOLUNTEER_ROLE",
        details={"target_user_id": str(user_id), "new_role": req.assigned_role}
    )
    db.add(log)
    db.commit()
    
    return StandardResponse.success_response(
        data={"user_id": str(user_id), "assigned_role": target_user.volunteer_profile.assigned_role},
        message="Volunteer role updated successfully."
    )


@router.patch("/users/{user_id}/feature-mentor", response_model=StandardResponse[dict])
def feature_mentor(
    user_id: UUID,
    req: FeatureMentorRequest,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user or not target_user.volunteer_profile:
        raise HTTPException(status_code=404, detail="Volunteer not found.")
    
    target_user.volunteer_profile.is_featured_mentor = req.is_featured_mentor
    
    log = ActivityLog(
        user_id=current_user.id,
        action="TOGGLE_FEATURED_MENTOR",
        details={"target_user_id": str(user_id), "is_featured": req.is_featured_mentor}
    )
    db.add(log)
    db.commit()
    
    return StandardResponse.success_response(
        data={"user_id": str(user_id), "is_featured_mentor": target_user.volunteer_profile.is_featured_mentor},
        message="Mentor feature status updated successfully."
    )


# RESOURCE MODERATION ENDPOINTS FOR ADMIN
@router.get("/pending-resources", response_model=StandardResponse[List[dict]])
def get_pending_resources_admin(
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    pending = db.query(Resource).filter(Resource.verification_status == "pending").order_by(Resource.created_at.desc()).all()
    data = [
        {
            "id": str(r.id),
            "title": r.title,
            "description": r.description,
            "external_url": r.external_url,
            "target_class": r.target_class or "N/A",
            "subject_name": r.subject_name or "N/A",
            "resource_category": r.resource_category or "Notes",
            "uploader_name": r.uploader.profile.full_name if (r.uploader and r.uploader.profile) else (r.uploader.email if r.uploader else "Contributor"),
            "uploader_email": r.uploader.email if r.uploader else "",
            "created_at": r.created_at.isoformat()
        } for r in pending
    ]
    return StandardResponse.success_response(data=data, message="Pending resources queue retrieved.")


@router.post("/resources/{id}/approve", response_model=StandardResponse[dict])
def approve_resource_admin(
    id: UUID,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    resource.verification_status = "approved"
    
    log = ActivityLog(
        user_id=current_user.id,
        action="RESOURCE_APPROVE",
        details={"resource_id": str(id), "title": resource.title}
    )
    db.add(log)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(id), "verification_status": "approved"},
        message="Resource approved and published to SAMIDHA Shiksha Library!"
    )


@router.post("/resources/{id}/reject", response_model=StandardResponse[dict])
def reject_resource_admin(
    id: UUID,
    req: RejectRequest,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    resource.verification_status = "rejected"
    resource.rejection_reason = req.reason.strip()
    
    log = ActivityLog(
        user_id=current_user.id,
        action="RESOURCE_REJECT",
        details={"resource_id": str(id), "reason": req.reason}
    )
    db.add(log)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(id), "verification_status": "rejected"},
        message="Resource rejected."
    )


@router.get("/pending-resource-deletions", response_model=StandardResponse[List[dict]])
def get_pending_resource_deletions_admin(
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    pending = db.query(Resource).filter(Resource.verification_status == "deletion_pending").order_by(Resource.created_at.desc()).all()
    data = [
        {
            "id": str(r.id),
            "title": r.title,
            "external_url": r.external_url,
            "target_class": r.target_class or "N/A",
            "subject_name": r.subject_name or "N/A",
            "deletion_reason": r.deletion_reason,
            "uploader_name": r.uploader.profile.full_name if (r.uploader and r.uploader.profile) else (r.uploader.email if r.uploader else "Contributor"),
            "uploader_email": r.uploader.email if r.uploader else "",
            "created_at": r.created_at.isoformat()
        } for r in pending
    ]
    return StandardResponse.success_response(data=data, message="Pending deletion requests queue retrieved.")


@router.post("/resources/{id}/approve-deletion", response_model=StandardResponse[dict])
def approve_resource_deletion_admin(
    id: UUID,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    title = resource.title
    db.delete(resource)
    
    log = ActivityLog(
        user_id=current_user.id,
        action="RESOURCE_DELETE_APPROVE",
        details={"resource_id": str(id), "title": title}
    )
    db.add(log)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(id), "status": "deleted"},
        message="Resource deletion request approved and file permanently removed."
    )


@router.post("/resources/{id}/reject-deletion", response_model=StandardResponse[dict])
def reject_resource_deletion_admin(
    id: UUID,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    resource.verification_status = "approved"
    resource.deletion_reason = None
    
    log = ActivityLog(
        user_id=current_user.id,
        action="RESOURCE_DELETE_REJECT",
        details={"resource_id": str(id), "title": resource.title}
    )
    db.add(log)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(id), "verification_status": "approved"},
        message="Resource deletion request rejected; resource restored to live library."
    )


# EVENT MODERATION ENDPOINTS FOR ADMIN
@router.get("/pending-events", response_model=StandardResponse[List[dict]])
def get_pending_events_admin(
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    pending = db.query(Event).filter(Event.verification_status == "pending").order_by(Event.created_at.desc()).all()
    data = [
        {
            "id": str(e.id),
            "title": e.title,
            "description": e.description,
            "mode": e.mode,
            "venue": e.venue,
            "event_date": e.event_date.isoformat(),
            "start_time": e.start_time,
            "whatsapp_group_url": e.whatsapp_group_url,
            "max_participants": e.max_participants,
            "organizer_name": e.organizer.profile.full_name if (e.organizer and e.organizer.profile) else (e.organizer.email if e.organizer else "Organizer"),
            "organizer_email": e.organizer.email if e.organizer else "",
            "created_at": e.created_at.isoformat()
        } for e in pending
    ]
    return StandardResponse.success_response(data=data, message="Pending events queue retrieved.")


@router.post("/events/{id}/approve", response_model=StandardResponse[dict])
def approve_event_admin(
    id: UUID,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.verification_status = "approved"
    
    log = ActivityLog(
        user_id=current_user.id,
        action="EVENT_APPROVE",
        details={"event_id": str(id), "title": event.title}
    )
    db.add(log)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(id), "verification_status": "approved"},
        message="Event approved and published live!"
    )


@router.post("/events/{id}/reject", response_model=StandardResponse[dict])
def reject_event_admin(
    id: UUID,
    req: RejectRequest,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.verification_status = "rejected"
    event.rejection_reason = req.reason.strip()
    
    log = ActivityLog(
        user_id=current_user.id,
        action="EVENT_REJECT",
        details={"event_id": str(id), "reason": req.reason}
    )
    db.add(log)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(id), "verification_status": "rejected"},
        message="Event rejected."
    )


@router.get("/healthcheck", response_model=StandardResponse[dict])
def run_system_healthcheck(
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    start_time = time.time()
    db.execute(text("SELECT 1"))
    latency_ms = round((time.time() - start_time) * 1000, 2)
    
    users_count = db.query(User).count()
    resources_count = db.query(Resource).count()
    events_count = db.query(Event).count()
    logs_count = db.query(ActivityLog).count()
    
    data = {
        "status": "HEALTHY",
        "database": {
            "connected": True,
            "latency_ms": latency_ms,
            "engine": "PostgreSQL"
        },
        "statistics": {
            "total_users": users_count,
            "total_resources": resources_count,
            "total_events": events_count,
            "total_logs": logs_count
        },
        "jwt_auth": {
            "status": "OPERATIONAL",
            "active_role": current_user.role.name
        },
        "storage": {
            "status": "OPERATIONAL",
            "provider": "Cloud Storage (Google Drive / S3 / Direct)"
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    return StandardResponse.success_response(data=data, message="System health diagnostic check completed.")


@router.get("/users", response_model=StandardResponse[List[dict]])
def get_all_users_admin(
    search: Optional[str] = None,
    role_filter: Optional[str] = None,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if search:
        query = query.join(User.profile).filter(
            (User.email.ilike(f"%{search}%")) | (User.profile.has(full_name=search))
        )
    if role_filter:
        query = query.join(User.role).filter(Role.name == role_filter)

    users = query.order_by(User.created_at.desc()).all()
    data = [
        {
            "id": str(u.id),
            "email": u.email,
            "role": u.role.name if u.role else "student",
            "full_name": u.profile.full_name if u.profile else "User",
            "phone": u.profile.phone if u.profile else "",
            "avatar_url": u.profile.avatar_url if u.profile else "",
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat()
        } for u in users
    ]
    return StandardResponse.success_response(data=data, message="User directory retrieved.")


@router.post("/users/{id}/promote-admin", response_model=StandardResponse[dict])
def promote_user_to_admin(
    id: UUID,
    current_user: User = Depends(require_roles(["super_admin", "admin"])),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        raise HTTPException(status_code=500, detail="Admin role definition missing")

    target_user.role_id = admin_role.id
    
    log = ActivityLog(
        user_id=current_user.id,
        action="USER_PROMOTE_ADMIN",
        details={"target_user_id": str(id), "email": target_user.email}
    )
    db.add(log)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(id), "role": "admin"},
        message=f"User {target_user.email} successfully promoted to Admin role!"
    )


@router.delete("/users/{id}", response_model=StandardResponse[dict])
def delete_user_account_admin(
    id: UUID,
    current_user: User = Depends(require_roles(["super_admin", "admin"])),
    db: Session = Depends(get_db)
):
    if str(id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account!")

    target_user = db.query(User).filter(User.id == id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    email = target_user.email
    db.delete(target_user)

    log = ActivityLog(
        user_id=current_user.id,
        action="USER_DELETE",
        details={"deleted_user_id": str(id), "email": email}
    )
    db.add(log)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(id), "status": "deleted"},
        message=f"User account ({email}) permanently removed."
    )


@router.get("/users/{id}/activity-logs", response_model=StandardResponse[List[dict]])
def get_user_activity_logs_admin(
    id: UUID,
    current_user: User = Depends(require_roles(["admin", "super_admin"])),
    db: Session = Depends(get_db)
):
    logs = db.query(ActivityLog).filter(ActivityLog.user_id == id).order_by(ActivityLog.created_at.desc()).all()
    data = [
        {
            "id": str(l.id),
            "action": l.action,
            "details": l.details,
            "created_at": l.created_at.isoformat()
        } for l in logs
    ]
    return StandardResponse.success_response(data=data, message="User activity trail retrieved.")
