from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse, MetaSchema
from app.models.events import Event

router = APIRouter()


@router.get("", response_model=StandardResponse[List[dict]])
def get_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Event).filter(Event.is_cancelled == False)
    total_items = query.count()
    offset = (page - 1) * limit
    events = query.order_by(Event.event_date.asc()).offset(offset).limit(limit).all()

    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 0

    data = [
        {
            "id": str(e.id),
            "title": e.title,
            "description": e.description,
            "poster_url": e.poster_url,
            "venue": e.venue,
            "event_date": e.event_date.isoformat(),
            "registrations_count": e.registrations_count
        } for e in events
    ]

    meta = MetaSchema(page=page, limit=limit, total_items=total_items, total_pages=total_pages)
    return StandardResponse.success_response(data=data, meta=meta, message="Events retrieved successfully.")
