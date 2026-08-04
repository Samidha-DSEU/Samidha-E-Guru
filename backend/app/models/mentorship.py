import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class MentorshipRequest(Base):
    __tablename__ = "mentorship_requests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    requester_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    alumni_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    message_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, accepted, declined
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    requester: Mapped["User"] = relationship("User", foreign_keys=[requester_id])
    alumni: Mapped["User"] = relationship("User", foreign_keys=[alumni_id])
    messages: Mapped[List["MentorshipMessage"]] = relationship("MentorshipMessage", back_populates="request", cascade="all, delete-orphan")


class MentorshipMessage(Base):
    __tablename__ = "mentorship_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("mentorship_requests.id", ondelete="CASCADE"), nullable=False)
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    request: Mapped["MentorshipRequest"] = relationship("MentorshipRequest", back_populates="messages")
    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id])
