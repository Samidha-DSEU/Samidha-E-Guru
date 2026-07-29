from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse, MetaSchema
from app.models.community import Post, Like
from app.middlewares.auth_middleware import get_current_user
from app.models.auth import User

router = APIRouter()


class CreatePostRequest(BaseModel):
    title: str
    content: str
    post_type: Optional[str] = "general"


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
            "author_name": p.author.profile.full_name if p.author and p.author.profile else "Community User",
            "author_avatar": p.author.profile.avatar_url if p.author and p.author.profile else None,
            "author_role": p.author.role.name if p.author and p.author.role else "student",
            "created_at": p.created_at.isoformat()
        } for p in posts
    ]

    meta = MetaSchema(page=page, limit=limit, total_items=total_items, total_pages=total_pages)
    return StandardResponse.success_response(data=data, meta=meta, message="Community posts retrieved successfully.")


@router.post("/posts", response_model=StandardResponse[dict], status_code=status.HTTP_201_CREATED)
def create_post(
    req: CreatePostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.title.strip() or not req.content.strip():
        raise HTTPException(status_code=400, detail="Title and content are required.")

    new_post = Post(
        author_id=current_user.id,
        title=req.title.strip(),
        content=req.content.strip(),
        post_type=req.post_type or "general",
        is_public=True
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    post_data = {
        "id": str(new_post.id),
        "title": new_post.title,
        "content": new_post.content,
        "post_type": new_post.post_type,
        "likes_count": new_post.likes_count,
        "comments_count": new_post.comments_count,
        "author_id": str(new_post.author_id),
        "author_name": current_user.profile.full_name if current_user.profile else "Community User",
        "author_avatar": current_user.profile.avatar_url if current_user.profile else None,
        "author_role": current_user.role.name if current_user.role else "student",
        "created_at": new_post.created_at.isoformat()
    }
    return StandardResponse.success_response(data=post_data, message="Post created successfully.")


@router.post("/posts/{post_id}/like", response_model=StandardResponse[dict])
def like_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_like = db.query(Like).filter(Like.post_id == post_id, Like.user_id == current_user.id).first()
    if existing_like:
        db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        liked = False
    else:
        new_like = Like(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        post.likes_count += 1
        liked = True

    db.commit()
    return StandardResponse.success_response(data={"liked": liked, "likes_count": post.likes_count}, message="Post like updated.")

