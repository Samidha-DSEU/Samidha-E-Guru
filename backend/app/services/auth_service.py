from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.auth import User, Role, Profile, LearnerProfile, VolunteerProfile, AlumniProfile, UserSession, ApprovalStatus
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token, hash_token, hash_password, verify_password
from app.core.config import settings
from google.oauth2 import id_token
from google.auth.transport import requests
from app.schemas.auth import GoogleAuthRequest, TokenResponse, UserMeResponse, UserRegisterRequest, UserLoginRequest, UserUpdateRequest
from app.services.notification_service import NotificationService
from app.services.settings_service import SettingsService


class AuthService:

    @staticmethod
    def authenticate_google_user(db: Session, req: GoogleAuthRequest) -> TokenResponse:
        try:
            idinfo = None
            token_str = req.id_token.strip()

            # 1. Try google-auth library ID token verification
            try:
                idinfo = id_token.verify_oauth2_token(
                    token_str, requests.Request(), settings.GOOGLE_CLIENT_ID, clock_skew_in_seconds=10
                )
            except Exception:
                pass

            # 2. Try fetching from Google TokenInfo endpoint if token has JWT structure
            import requests as req_lib
            if not idinfo and "." in token_str:
                try:
                    r = req_lib.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token_str}", timeout=10)
                    if r.status_code == 200:
                        idinfo = r.json()
                except Exception:
                    pass

            # 3. Try fetching from Google UserInfo endpoint for OAuth2 Access Tokens
            if not idinfo:
                try:
                    r = req_lib.get("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {token_str}"}, timeout=10)
                    if r.status_code == 200:
                        idinfo = r.json()
                except Exception:
                    pass

            if not idinfo or "email" not in idinfo:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google authentication token.")

            email = idinfo['email']
            name = idinfo.get('name') or idinfo.get('given_name') or email.split('@')[0]
            picture = idinfo.get('picture', None)

            user = db.query(User).filter(User.email == email).first()
            now = datetime.now(timezone.utc)

            if req.admin_secret and req.admin_secret == settings.SUPER_ADMIN_SECRET_KEY:
                target_role = "super_admin"
            elif req.admin_secret and req.admin_secret == settings.ADMIN_SECRET_KEY:
                target_role = "admin"
            else:
                target_role = req.role_name if req.role_name in ["student", "volunteer", "alumni"] else "student"

            if not user:
                role = db.query(Role).filter(Role.name == target_role).first()
                if not role:
                    role = Role(name=target_role, description=f"{target_role} role")
                    db.add(role)
                    db.flush()
                
                user = User(
                    email=email,
                    role_id=role.id,
                    is_active=True,
                    is_verified=True,
                    created_at=now
                )
                db.add(user)
                db.flush()

                # Create profile with real name and avatar from Google
                profile = Profile(
                    user_id=user.id,
                    full_name=name,
                    avatar_url=picture
                )
                db.add(profile)

                if target_role == "student":
                    db.add(LearnerProfile(user_id=user.id))
                elif target_role == "volunteer":
                    require_verification = SettingsService.get_setting(db, "require_volunteer_verification", default=True)
                    expires = now + timedelta(days=3)
                    db.add(VolunteerProfile(
                        user_id=user.id,
                        approval_status=ApprovalStatus.PENDING.value if require_verification else ApprovalStatus.APPROVED.value,
                        is_approved=not require_verification,
                        applied_at=now,
                        expires_at=expires
                    ))
                elif target_role == "alumni":
                    db.add(AlumniProfile(user_id=user.id))
                
                db.commit()
                db.refresh(user)

                if target_role == "volunteer":
                    require_verification = SettingsService.get_setting(db, "require_volunteer_verification", default=True)
                    if require_verification:
                        NotificationService.notify_admins_new_volunteer(db, user)

            else:
                # Auto-upgrade logic on email registration
                if req.admin_secret == settings.SUPER_ADMIN_SECRET_KEY and user.role.name != "super_admin":
                    role = db.query(Role).filter(Role.name == "super_admin").first()
                    if role:
                        user.role_id = role.id
                        db.commit()
                        db.refresh(user)
                elif req.admin_secret == settings.ADMIN_SECRET_KEY and user.role.name not in ["admin", "super_admin"]:
                    role = db.query(Role).filter(Role.name == "admin").first()
                    if role:
                        user.role_id = role.id
                        db.commit()
                        db.refresh(user)

            # Update login & activity timestamps
            user.last_login_at = now
            user.last_seen_at = now
            db.commit()

            access_token = create_access_token(subject=str(user.id), role=user.role.name)
            refresh_token = create_refresh_token(subject=str(user.id))

            user_me = AuthService.get_me(user)

            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=1800,
                user=user_me
            )

        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google authentication token.")

    @staticmethod
    def register_user(db: Session, req: UserRegisterRequest) -> TokenResponse:
        existing_user = db.query(User).filter(User.email == req.email).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
        if req.admin_secret and req.admin_secret == settings.SUPER_ADMIN_SECRET_KEY:
            target_role = "super_admin"
        elif req.admin_secret and req.admin_secret == settings.ADMIN_SECRET_KEY:
            target_role = "admin"
        else:
            target_role = req.role_name if req.role_name in ["student", "volunteer", "alumni"] else "student"

        role = db.query(Role).filter(Role.name == target_role).first()
        if not role:
            role = db.query(Role).filter(Role.name == "student").first()
            
        now = datetime.now(timezone.utc)
        user = User(
            email=req.email,
            hashed_password=hash_password(req.password),
            role_id=role.id,
            is_active=True,
            is_verified=False,
            created_at=now
        )
        db.add(user)
        db.flush()

        # Create default profile
        profile = Profile(
            user_id=user.id,
            full_name=req.full_name
        )
        db.add(profile)

        if target_role == "student":
            db.add(LearnerProfile(user_id=user.id))
        elif target_role == "volunteer":
            require_verification = SettingsService.get_setting(db, "require_volunteer_verification", default=True)
            expires = now + timedelta(days=3)
            db.add(VolunteerProfile(
                user_id=user.id,
                approval_status=ApprovalStatus.PENDING.value if require_verification else ApprovalStatus.APPROVED.value,
                is_approved=not require_verification,
                applied_at=now,
                expires_at=expires
            ))
        elif target_role == "alumni":
            db.add(AlumniProfile(user_id=user.id))
        
        db.commit()
        db.refresh(user)

        if target_role == "volunteer":
            require_verification = SettingsService.get_setting(db, "require_volunteer_verification", default=True)
            if require_verification:
                NotificationService.notify_admins_new_volunteer(db, user)

        user.last_login_at = now
        user.last_seen_at = now
        db.commit()

        access_token = create_access_token(subject=str(user.id), role=user.role.name)
        refresh_token = create_refresh_token(subject=str(user.id))

        user_me = AuthService.get_me(user)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=1800,
            user=user_me
        )

    @staticmethod
    def authenticate_email_user(db: Session, req: UserLoginRequest) -> TokenResponse:
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not user.hashed_password:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
        if not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        # Auto-upgrade role during normal email login is removed since we only trust secrets at registration.
        # However, we can still process it if admin_secret is passed in login (though not in the schema, 
        # so we won't auto-upgrade during email login).


        now = datetime.now(timezone.utc)
        user.last_login_at = now
        user.last_seen_at = now
        db.commit()

        access_token = create_access_token(subject=str(user.id), role=user.role.name)
        refresh_token = create_refresh_token(subject=str(user.id))

        user_me = AuthService.get_me(user)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=1800,
            user=user_me
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

    @staticmethod
    def delete_me(db: Session, current_user: User) -> dict:
        role_name = current_user.role.name if current_user.role else "student"
        
        # Restrict verified volunteers and verified alumni from self-deletion
        is_verified_volunteer = (
            role_name == "volunteer" and 
            current_user.volunteer_profile and 
            current_user.volunteer_profile.approval_status == ApprovalStatus.APPROVED.value
        )
        is_verified_alumni = (
            role_name == "alumni" and 
            current_user.alumni_profile is not None
        )

        if is_verified_volunteer or is_verified_alumni:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Verified Volunteer Educator and Alumni Mentor accounts cannot be self-deleted to preserve student learning records. Please contact an Administrator."
            )

        if role_name in ["admin", "super_admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrator accounts cannot be self-deleted. Contact Super Admin."
            )

        user_id = str(current_user.id)
        email = current_user.email
        db.delete(current_user)
        db.commit()
        return {"deleted_user_id": user_id, "email": email, "status": "deleted"}
