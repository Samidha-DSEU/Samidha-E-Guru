import uuid
import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, Integer, BigInteger, Float, Boolean, ForeignKey, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.session import Base


class ResourceCategory(str, enum.Enum):
    NOTES = "Notes"
    PYQ = "Question Paper / PYQ"
    SAMPLE = "Sample Paper"
    WORKSHEET = "Worksheet"


class TargetClass(str, enum.Enum):
    CLASS_6 = "Class 6"
    CLASS_7 = "Class 7"
    CLASS_8 = "Class 8"
    CLASS_9 = "Class 9"
    CLASS_10 = "Class 10"
    CLASS_11 = "Class 11"
    CLASS_12 = "Class 12"
    UNDERGRADUATE = "Undergraduate"


class ResourceType(Base):
    __tablename__ = "resource_types"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    resources: Mapped[List["Resource"]] = relationship(back_populates="resource_type")


class ResourceSource(Base):
    __tablename__ = "resource_sources"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    resources: Mapped[List["Resource"]] = relationship(back_populates="resource_source")


class Resource(Base):
    __tablename__ = "resources"
    __table_args__ = (
        Index("idx_resource_filter", "target_class", "subject_name", "resource_category"),
        Index("idx_resource_source", "verification_status", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    external_url: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Classification Fields for SAMIDHA SHIKSHA LIBRARY
    target_class: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    subject_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    resource_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    source_type: Mapped[str] = mapped_column(String(50), default="samidha", index=True) # samidha, ncert, kvs, diksha

    # Rating Aggregations
    rating_sum: Mapped[int] = mapped_column(Integer, default=0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    rating_avg: Mapped[float] = mapped_column(Float, default=0.0)

    chapter_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("chapters.id", ondelete="CASCADE"), nullable=True)
    resource_type_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("resource_types.id"), nullable=True)
    resource_source_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("resource_sources.id"), nullable=True)
    uploader_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, approved, rejected, deletion_pending
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deletion_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    bookmarks_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    chapter: Mapped[Optional["Chapter"]] = relationship(back_populates="resources")
    resource_type: Mapped[Optional["ResourceType"]] = relationship(back_populates="resources")
    resource_source: Mapped[Optional["ResourceSource"]] = relationship(back_populates="resources")
    uploader: Mapped[Optional["User"]] = relationship()
    files: Mapped[List["ResourceFile"]] = relationship(back_populates="resource", cascade="all, delete-orphan")
    bookmarks: Mapped[List["Bookmark"]] = relationship(back_populates="resource", cascade="all, delete-orphan")
    reports: Mapped[List["ResourceReport"]] = relationship(back_populates="resource", cascade="all, delete-orphan")
    ratings: Mapped[List["ResourceRating"]] = relationship(back_populates="resource", cascade="all, delete-orphan")


class ResourceFile(Base):
    __tablename__ = "resource_files"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resource_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    file_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    resource: Mapped["Resource"] = relationship(back_populates="files")


class ResourceRating(Base):
    __tablename__ = "resource_ratings"
    __table_args__ = (UniqueConstraint("user_id", "resource_id", name="uq_user_resource_rating"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resource_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    stars: Mapped[int] = mapped_column(Integer, nullable=False)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship()
    resource: Mapped["Resource"] = relationship(back_populates="ratings")


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "resource_id", name="uq_user_resource_bookmark"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resource_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship()
    resource: Mapped["Resource"] = relationship(back_populates="bookmarks")


class LearningProgress(Base):
    __tablename__ = "learning_progress"
    __table_args__ = (UniqueConstraint("user_id", "chapter_id", name="uq_user_chapter_progress"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    chapter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    completed_resources_count: Mapped[int] = mapped_column(Integer, default=0)
    total_resources_count: Mapped[int] = mapped_column(Integer, default=0)
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ResourceView(Base):
    __tablename__ = "resource_views"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resource_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    viewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ResourceReport(Base):
    __tablename__ = "resource_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    resource_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="open")  # open, resolved, dismissed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    resource: Mapped["Resource"] = relationship(back_populates="reports")
    reporter: Mapped["User"] = relationship()
