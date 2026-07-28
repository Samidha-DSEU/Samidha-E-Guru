from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.models.education import ClassModel, Subject, Chapter

router = APIRouter()


@router.get("/classes", response_model=StandardResponse[List[dict]])
def get_classes(db: Session = Depends(get_db)):
    classes = db.query(ClassModel).order_by(ClassModel.display_order.asc()).all()
    data = [{"id": str(c.id), "name": c.name, "code": c.code} for c in classes]
    return StandardResponse.success_response(data=data, message="Classes fetched successfully.")


@router.get("/classes/{class_id}/subjects", response_model=StandardResponse[List[dict]])
def get_subjects_by_class(class_id: UUID, db: Session = Depends(get_db)):
    subjects = db.query(Subject).filter(Subject.class_id == class_id).all()
    data = [{"id": str(s.id), "name": s.name, "code": s.code} for s in subjects]
    return StandardResponse.success_response(data=data, message="Subjects fetched successfully.")


@router.get("/subjects/{subject_id}/chapters", response_model=StandardResponse[List[dict]])
def get_chapters_by_subject(subject_id: UUID, db: Session = Depends(get_db)):
    chapters = db.query(Chapter).filter(Chapter.subject_id == subject_id).order_by(Chapter.chapter_number.asc()).all()
    data = [{"id": str(ch.id), "name": ch.name, "chapter_number": ch.chapter_number, "description": ch.description} for ch in chapters]
    return StandardResponse.success_response(data=data, message="Chapters fetched successfully.")
