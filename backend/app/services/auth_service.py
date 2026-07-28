from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.auth import User, Role, Profile, LearnerProfile, VolunteerProfile, AlumniProfile, UserSession
from app.models.auth import User, Role, Profile, LearnerProfile, VolunteerProfile, AlumniProfile, UserSession
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token, hash_token, hash_password, verify_password
from app.schemas.auth import GoogleAuthRequest, TokenResponse, UserMeResponse, UserRegisterRequest, UserLoginRequest, UserUpdateRequest

class AuthService:

    @staticmethod
    def authenticate_google_user(db: Session, req: GoogleAuthRequest) -> TokenResponse:
        # Google OAuth is pending real integration in Phase 2
        # Throw 501 Not Implemented
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Google OAuth integration is pending. Please create a new account using Email and Password.")

    @staticmethod
    def register_user(db: Session, req: UserRegisterRequest) -> TokenResponse:
        existing_user = db.query(User).filter(User.email == req.email).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
        role = db.query(Role).filter(Role.name == req.role_name).first()
        if not role:
            role = db.query(Role).filter(Role.name == "student").first()
            
        user = User(
            email=req.email,
            hashed_password=hash_password(req.password),
            role_id=role.id,
            is_active=True,
            is_verified=False
        )
        db.add(user)
        db.flush()

        # Create default profile
        profile = Profile(
            user_id=user.id,
            full_name=req.full_name
        )
        db.add(profile)

        if req.role_name == "student":
            db.add(LearnerProfile(user_id=user.id))
        elif req.role_name == "volunteer":
            db.add(VolunteerProfile(user_id=user.id, is_approved=False))
        elif req.role_name == "alumni":
            db.add(AlumniProfile(user_id=user.id))
        
        db.commit()
        db.refresh(user)

        if user.role.name == "volunteer":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Registration successful. Your account is pending admin approval.")

        access_token = create_access_token(subject=str(user.id), role=user.role.name)
        refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=1800
        )

    @staticmethod
    def authenticate_email_user(db: Session, req: UserLoginRequest) -> TokenResponse:
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not user.hashed_password:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
        if not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
            
        if user.role.name == "volunteer" and user.volunteer_profile and not user.volunteer_profile.is_approved:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your volunteer account is pending admin approval.")

        access_token = create_access_token(subject=str(user.id), role=user.role.name)
        refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=1800
        )

    @staticmethod
    def get_me(current_user: User) -> UserMeResponse:
        return UserMeResponse.model_validate(current_user)

    @staticmethod
    def update_me(db: Session, current_user: User, req: UserUpdateRequest) -> UserMeResponse:
        if req.profile and current_user.profile:
            for key, value in req.profile.model_dump(exclude_unset=True).items():
                setattr(current_user.profile, key, value)
                
        if req.learner_profile and current_user.learner_profile:
            for key, value in req.learner_profile.model_dump(exclude_unset=True).items():
                setattr(current_user.learner_profile, key, value)
                
        if req.volunteer_profile and current_user.volunteer_profile:
            for key, value in req.volunteer_profile.model_dump(exclude_unset=True).items():
                setattr(current_user.volunteer_profile, key, value)
                
        if req.alumni_profile and current_user.alumni_profile:
            for key, value in req.alumni_profile.model_dump(exclude_unset=True).items():
                setattr(current_user.alumni_profile, key, value)
                
        db.commit()
        db.refresh(current_user)
        return UserMeResponse.model_validate(current_user)
