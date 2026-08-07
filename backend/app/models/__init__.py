from app.db.session import Base
from app.models.auth import Role, User, Profile, LearnerProfile, VolunteerProfile, AlumniProfile, UserSession
from app.models.education import ClassModel, Subject, Chapter
from app.models.resources import (
    ResourceType, ResourceSource, Resource, ResourceFile,
    Bookmark, LearningProgress, ResourceView, ResourceReport
)
from app.models.community import Post, PostImage, Comment, Like
from app.models.events import Event, EventRegistration
from app.models.communication import Announcement, Notification, ContactMessage
from app.models.administration import ScraperSource, ScraperJob, ActivityLog
from app.models.mentorship import MentorshipRequest, MentorshipMessage
from app.models.learn_ai import (
    AIDocument, AIDocumentChunk, AIWorkspaceCache, QuestionBank, StudentProgress
)

__all__ = [
    "Base",
    "Role",
    "User",
    "Profile",
    "LearnerProfile",
    "VolunteerProfile",
    "AlumniProfile",
    "UserSession",
    "ClassModel",
    "Subject",
    "Chapter",
    "ResourceType",
    "ResourceSource",
    "Resource",
    "ResourceFile",
    "Bookmark",
    "LearningProgress",
    "ResourceView",
    "ResourceReport",
    "Post",
    "PostImage",
    "Comment",
    "Like",
    "Event",
    "EventRegistration",
    "Announcement",
    "Notification",
    "ContactMessage",
    "ScraperSource",
    "ScraperJob",
    "ActivityLog",
    "MentorshipRequest",
    "MentorshipMessage",
    "AIDocument",
    "AIDocumentChunk",
    "AIWorkspaceCache",
    "QuestionBank",
    "StudentProgress",
]
