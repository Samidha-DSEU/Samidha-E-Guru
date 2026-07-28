from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.models.communication import Announcement

router = APIRouter()


@router.get("/announcements", response_model=StandardResponse[List[dict]])
def get_announcements(db: Session = Depends(get_db)):
    announcements = db.query(Announcement).filter(Announcement.is_active == True).order_by(Announcement.created_at.desc()).all()
    data = [
        {
            "id": str(a.id),
            "title": a.title,
            "content": a.content,
            "target_role": a.target_role,
            "created_at": a.created_at.isoformat()
        } for a in announcements
    ]
    return StandardResponse.success_response(data=data, message="Active announcements fetched.")
