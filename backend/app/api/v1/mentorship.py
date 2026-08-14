from typing import List, Optional
from datetime import datetime, timezone, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.middlewares.auth_middleware import get_current_user
from app.models.auth import User, Role, AlumniProfile
from app.models.mentorship import MentorshipRequest, MentorshipMessage
from app.models.communication import Notification

router = APIRouter()


class CreateMentorshipRequestSchema(BaseModel):
    alumni_id: UUID
    topic: str
    message_note: Optional[str] = None


class RespondMentorshipRequestSchema(BaseModel):
    action: str  # "accept" or "decline"


class SendChatMessageSchema(BaseModel):
    message: str


@router.get("/alumni", response_model=StandardResponse[List[dict]])
def get_all_alumni_mentors(
    db: Session = Depends(get_db)
):
    alumni_role = db.query(Role).filter(Role.name == "alumni").first()
    if not alumni_role:
        return StandardResponse.success_response(data=[], message="No alumni found.")

    users = db.query(User).filter(User.role_id == alumni_role.id, User.is_active == True).all()
    data = []
    for u in users:
        ap = u.alumni_profile
        data.append({
            "id": str(u.id),
            "full_name": u.profile.full_name if u.profile else "Alumni Mentor",
            "email": u.email,
            "avatar_url": u.profile.avatar_url if u.profile else None,
            "bio": u.profile.bio if u.profile else "Experienced industry professional & SAMIDHA mentor.",
            "current_company": ap.current_company if ap else "Tech / Industry Professional",
            "designation": ap.designation if ap else "Senior Mentor"
        })

    return StandardResponse.success_response(data=data, message="Alumni mentors directory retrieved.")


@router.get("/volunteer-heads", response_model=StandardResponse[List[dict]])
def get_volunteer_heads(db: Session = Depends(get_db)):
    volunteer_role = db.query(Role).filter(Role.name == "volunteer").first()
    if not volunteer_role:
        return StandardResponse.success_response(data=[], message="No volunteers found.")

    users = db.query(User).filter(User.role_id == volunteer_role.id, User.is_active == True).all()
    data = []
    for u in users:
        vp = u.volunteer_profile
        if vp and vp.is_approved and vp.assigned_role and vp.assigned_role.strip():
            phone_number = vp.whatsapp_number or (u.profile.phone if u.profile else None)
            data.append({
                "id": str(u.id),
                "full_name": u.profile.full_name if u.profile else "Volunteer Head",
                "academic_year": vp.academic_year or "Senior",
                "samidha_designation": vp.assigned_role,
                "subjects": vp.expertise_areas if isinstance(vp.expertise_areas, list) else (vp.expertise_areas or "General Mentorship"),
                "email": u.email,
                "whatsapp_number": phone_number,
                "avatar_url": u.profile.avatar_url if u.profile else None,
                "avatar_initials": u.profile.full_name[:2].upper() if u.profile and u.profile.full_name else "VH"
            })
    return StandardResponse.success_response(data=data, message="Volunteer heads retrieved.")


@router.post("/request", response_model=StandardResponse[dict])
def request_mentorship(
    req: CreateMentorshipRequestSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alumni = db.query(User).filter(User.id == req.alumni_id).first()
    if not alumni:
        raise HTTPException(status_code=404, detail="Target Alumni Mentor not found")

    m_request = MentorshipRequest(
        requester_id=current_user.id,
        alumni_id=req.alumni_id,
        topic=req.topic.strip(),
        message_note=req.message_note.strip() if req.message_note else None,
        status="pending"
    )
    db.add(m_request)

    # Generate Notification for Alumni
    requester_name = current_user.profile.full_name if current_user.profile else current_user.email
    notif = Notification(
        user_id=req.alumni_id,
        title="New Mentorship Request Received! 🤝",
        message=f"{requester_name} has requested guidance on topic: '{req.topic}'. Check your Alumni Portal to accept or decline.",
        notification_type="mentorship"
    )
    db.add(notif)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(m_request.id), "status": "pending"},
        message="Mentorship request sent successfully! Notification sent to Alumni Mentor."
    )


@router.get("/requests/received", response_model=StandardResponse[List[dict]])
def get_received_mentorship_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(MentorshipRequest).filter(MentorshipRequest.alumni_id == current_user.id).order_by(MentorshipRequest.created_at.desc()).all()
    data = [
        {
            "id": str(r.id),
            "topic": r.topic,
            "message_note": r.message_note,
            "status": r.status,
            "requester_name": r.requester.profile.full_name if (r.requester and r.requester.profile) else (r.requester.email if r.requester else "User"),
            "requester_email": r.requester.email if r.requester else "",
            "created_at": r.created_at.isoformat()
        } for r in requests
    ]
    return StandardResponse.success_response(data=data, message="Incoming mentorship requests retrieved.")


@router.get("/requests/sent", response_model=StandardResponse[List[dict]])
def get_sent_mentorship_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(MentorshipRequest).filter(MentorshipRequest.requester_id == current_user.id).order_by(MentorshipRequest.created_at.desc()).all()
    data = [
        {
            "id": str(r.id),
            "topic": r.topic,
            "message_note": r.message_note,
            "status": r.status,
            "alumni_name": r.alumni.profile.full_name if (r.alumni and r.alumni.profile) else (r.alumni.email if r.alumni else "Alumni Mentor"),
            "alumni_email": r.alumni.email if r.alumni else "",
            "created_at": r.created_at.isoformat()
        } for r in requests
    ]
    return StandardResponse.success_response(data=data, message="Sent mentorship requests retrieved.")


@router.post("/requests/{id}/respond", response_model=StandardResponse[dict])
def respond_to_mentorship_request(
    id: UUID,
    req: RespondMentorshipRequestSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m_request = db.query(MentorshipRequest).filter(MentorshipRequest.id == id, MentorshipRequest.alumni_id == current_user.id).first()
    if not m_request:
        raise HTTPException(status_code=404, detail="Mentorship request not found or unauthorized")

    if req.action.lower() == "accept":
        m_request.status = "accepted"
        msg_text = "Request ACCEPTED! Chat room is now active."
    else:
        m_request.status = "declined"
        msg_text = "Request DECLINED."

    # Generate Notification for Requester
    alumni_name = current_user.profile.full_name if current_user.profile else current_user.email
    notif = Notification(
        user_id=m_request.requester_id,
        title=f"Mentorship Request Update ({m_request.status.upper()})",
        message=f"{alumni_name} has {m_request.status} your mentorship request for '{m_request.topic}'.",
        notification_type="mentorship"
    )
    db.add(notif)
    db.commit()

    return StandardResponse.success_response(data={"id": str(id), "status": m_request.status}, message=msg_text)


@router.get("/requests/{id}/messages", response_model=StandardResponse[List[dict]])
def get_chat_messages(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m_request = db.query(MentorshipRequest).filter(MentorshipRequest.id == id).first()
    if not m_request:
        raise HTTPException(status_code=404, detail="Mentorship request not found")

    if str(current_user.id) not in [str(m_request.requester_id), str(m_request.alumni_id)]:
        raise HTTPException(status_code=403, detail="Unauthorized to view this mentorship chat")

    # 🧹 AUTOMATIC 3-DAY (72 HOURS) AUTO-PURGE EXPIRY CLEANUP
    cutoff_time = datetime.now(timezone.utc) - timedelta(days=3)
    db.query(MentorshipMessage).filter(
        MentorshipMessage.request_id == id,
        MentorshipMessage.created_at < cutoff_time
    ).delete()
    db.commit()

    messages = db.query(MentorshipMessage).filter(MentorshipMessage.request_id == id).order_by(MentorshipMessage.created_at.asc()).all()
    data = [
        {
            "id": str(m.id),
            "sender_id": str(m.sender_id),
            "sender_name": m.sender.profile.full_name if (m.sender and m.sender.profile) else (m.sender.email if m.sender else "User"),
            "message": m.message,
            "created_at": m.created_at.isoformat()
        } for m in messages
    ]
    return StandardResponse.success_response(data=data, message="Chat messages retrieved. (Older than 3 days auto-purged)")


@router.post("/requests/{id}/messages", response_model=StandardResponse[dict])
def send_chat_message(
    id: UUID,
    req: SendChatMessageSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m_request = db.query(MentorshipRequest).filter(MentorshipRequest.id == id).first()
    if not m_request:
        raise HTTPException(status_code=404, detail="Mentorship request not found")

    if m_request.status != "accepted":
        raise HTTPException(status_code=400, detail="Cannot send message. Mentorship request is not accepted yet.")

    if str(current_user.id) not in [str(m_request.requester_id), str(m_request.alumni_id)]:
        raise HTTPException(status_code=403, detail="Unauthorized to post in this chat room")

    chat_msg = MentorshipMessage(
        request_id=id,
        sender_id=current_user.id,
        message=req.message.strip()
    )
    db.add(chat_msg)
    db.commit()

    return StandardResponse.success_response(
        data={"id": str(chat_msg.id), "message": chat_msg.message, "created_at": chat_msg.created_at.isoformat()},
        message="Message sent."
    )
