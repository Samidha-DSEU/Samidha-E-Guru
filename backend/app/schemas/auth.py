import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class GoogleAuthRequest(BaseModel):
    id_token: str
    role_name: Optional[str] = "student"  # student, volunteer, alumni


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RoleSchema(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileSchema(BaseModel):
    full_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class LearnerProfileSchema(BaseModel):
    institution_type: Optional[str] = None
    institution_name: Optional[str] = None
    class_or_degree: Optional[str] = None
    interests: Optional[List[str]] = None

    class Config:
        from_attributes = True


class VolunteerProfileSchema(BaseModel):
    organization: Optional[str] = None
    expertise_areas: Optional[List[str]] = None
    volunteer_hours: int = 0
    is_approved: bool = False

    class Config:
        from_attributes = True


class AlumniProfileSchema(BaseModel):
    graduation_year: Optional[int] = None
    current_company: Optional[str] = None
    designation: Optional[str] = None
    mentorship_offered: bool = True

    class Config:
        from_attributes = True


class UserMeResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    is_active: bool
    is_verified: bool
    role: RoleSchema
    profile: Optional[ProfileSchema] = None
    learner_profile: Optional[LearnerProfileSchema] = None
    volunteer_profile: Optional[VolunteerProfileSchema] = None
    alumni_profile: Optional[AlumniProfileSchema] = None

    class Config:
        from_attributes = True
