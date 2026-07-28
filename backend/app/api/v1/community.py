from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse, MetaSchema
from app.models.community import Post
from app.middlewares.auth_middleware import get_current_user
from app.models.auth import User

router = APIRouter()


@router.get("/posts", response_model=StandardResponse[List[dict]])
def get_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    post_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Post).filter(Post.is_public == True)
    if post_type:
        query = query.filter(Post.post_type == post_type)

    total_items = query.count()
    offset = (page - 1) * limit
    posts = query.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()

    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 0

    data = [
        {
            "id": str(p.id),
            "title": p.title,
            "content": p.content,
            "post_type": p.post_type,
            "likes_count": p.likes_count,
            "comments_count": p.comments_count,
            "author_id": str(p.author_id),
            "created_at": p.created_at.isoformat()
        } for p in posts
    ]

    meta = MetaSchema(page=page, limit=limit, total_items=total_items, total_pages=total_pages)
    return StandardResponse.success_response(data=data, meta=meta, message="Community posts retrieved successfully.")
