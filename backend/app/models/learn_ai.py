import uuid
from datetime import datetime
from typing import Optional, Any, Dict, List
from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, Index, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.session import Base

try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False
    Vector = None

# Portable dialect types (JSONB on PostgreSQL, JSON on SQLite / Unit Tests)
JSONType = JSON().with_variant(JSONB, "postgresql")

if HAS_PGVECTOR and Vector is not None:
    VectorType = Vector(384).with_variant(JSON, "sqlite")
else:
    VectorType = JSON


class AIDocument(Base):
    __tablename__ = "ai_documents"
    __table_args__ = (
        Index("idx_ai_doc_resource", "resource_id"),
        Index("idx_ai_doc_hash", "file_hash", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resource_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    total_pages: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    chunks: Mapped[List["AIDocumentChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class AIDocumentChunk(Base):
    __tablename__ = "ai_document_chunks"
    __table_args__ = (
        Index("idx_ai_chunk_resource", "resource_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_documents.id", ondelete="CASCADE"), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, default={})
    embedding: Mapped[Optional[Any]] = mapped_column(VectorType, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped["AIDocument"] = relationship(back_populates="chunks")


class AIWorkspaceCache(Base):
    __tablename__ = "ai_workspace_caches"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resource_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    workspace_data: Mapped[Dict[str, Any]] = mapped_column(JSONType, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class QuestionBank(Base):
    __tablename__ = "ai_question_banks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resource_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    questions_data: Mapped[Dict[str, Any]] = mapped_column(JSONType, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class StudentProgress(Base):
    __tablename__ = "ai_student_progress"
    __table_args__ = (
        Index("idx_student_progress_user_resource", "user_id", "resource_id", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    quizzes_taken: Mapped[int] = mapped_column(Integer, default=0)
    last_quiz_score: Mapped[int] = mapped_column(Integer, default=0)
    weak_topics: Mapped[List[str]] = mapped_column(JSONType, default=[])
    mastered_flashcards: Mapped[List[str]] = mapped_column(JSONType, default=[])
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
