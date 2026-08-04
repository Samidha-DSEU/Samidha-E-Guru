from typing import List, Optional
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse, MetaSchema
from app.models.events import Event, EventRegistration
from app.middlewares.auth_middleware import get_current_user, require_approved_volunteer
from app.models.auth import User

router = APIRouter()


class CreateEventRequest(BaseModel):
    title: str
    description: str
    mode: str = "online" # online, offline
    venue: str # physical location or online meeting link
    event_date: datetime
    start_time: Optional[str] = None
    whatsapp_group_url: Optional[str] = None
    poster_url: Optional[str] = None
    max_participants: Optional[int] = 50


class RegisterEventRequest(BaseModel):
    full_name: str
    class_or_college: str
    mobile_number: str
    address: str


@router.get("", response_model=StandardResponse[List[dict]])
def get_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Event).filter(
        Event.verification_status == "approved",
        Event.is_cancelled == False
    )
    total_items = query.count()
    offset = (page - 1) * limit
    events = query.order_by(Event.event_date.asc()).offset(offset).limit(limit).all()

    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 0

    data = [
        {
            "id": str(e.id),
            "title": e.title,
            "description": e.description,
            "mode": e.mode,
            "venue": e.venue,
            "poster_url": e.poster_url,
            "event_date": e.event_date.isoformat(),
            "start_time": e.start_time,
            "whatsapp_group_url": e.whatsapp_group_url,
            "max_participants": e.max_participants,
            "registrations_count": e.registrations_count,
            "organizer_name": e.organizer.profile.full_name if (e.organizer and e.organizer.profile) else "SAMIDHA Organizer"
        } for e in events
    ]

    meta = MetaSchema(page=page, limit=limit, total_items=total_items, total_pages=total_pages)
    return StandardResponse.success_response(data=data, meta=meta, message="Approved events retrieved successfully.")


@router.post("", response_model=StandardResponse[dict])
def create_event(
    req: CreateEventRequest,
    current_user: User = Depends(require_approved_volunteer),
    db: Session = Depends(get_db)
):
    event = Event(
        title=req.title.strip(),
        description=req.description.strip(),
        mode=req.mode,
        venue=req.venue.strip(),
        event_date=req.event_date,
        start_time=req.start_time.strip() if req.start_time else None,
        whatsapp_group_url=req.whatsapp_group_url.strip() if req.whatsapp_group_url else None,
        poster_url=req.poster_url,
        max_participants=req.max_participants,
        organizer_id=current_user.id,
        verification_status="pending"
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return StandardResponse.success_response(
        data={
            "id": str(event.id),
            "title": event.title,
            "verification_status": event.verification_status,
            "created_at": event.created_at.isoformat()
        },
        message="Event/Bootcamp created successfully and submitted for Admin verification."
    )


@router.post("/{id}/register", response_model=StandardResponse[dict])
def register_for_event(
    id: UUID,
    req: RegisterEventRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == id, Event.verification_status == "approved").first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found or not approved")

    if event.is_cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event has been cancelled")

    existing_reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == id,
        EventRegistration.user_id == current_user.id
    ).first()

    if existing_reg:
        return StandardResponse.success_response(
            data={
                "event_id": str(id),
                "whatsapp_group_url": event.whatsapp_group_url,
                "already_registered": True
            },
            message="You are already registered for this event!"
        )

    registration = EventRegistration(
        event_id=id,
        user_id=current_user.id,
        full_name=req.full_name.strip(),
        class_or_college=req.class_or_college.strip(),
        mobile_number=req.mobile_number.strip(),
        address=req.address.strip()
    )
    db.add(registration)
    event.registrations_count += 1
    db.commit()

    return StandardResponse.success_response(
        data={
            "event_id": str(id),
            "whatsapp_group_url": event.whatsapp_group_url,
            "already_registered": False
        },
        message="Registration successful! Join the WhatsApp group for updates."
    )
