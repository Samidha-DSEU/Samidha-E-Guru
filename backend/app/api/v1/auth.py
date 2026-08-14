from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import StandardResponse
from app.schemas.auth import GoogleAuthRequest, TokenResponse, UserMeResponse, UserRegisterRequest, UserLoginRequest, UserUpdateRequest
from app.services.auth_service import AuthService
from app.middlewares.auth_middleware import get_current_user
from app.models.auth import User
from app.core.rate_limiter import RateLimiter

router = APIRouter()


@router.post("/google", response_model=StandardResponse[TokenResponse])
def google_login(req: GoogleAuthRequest, request: Request, db: Session = Depends(get_db)):
    RateLimiter.check_rate_limit(request)
    tokens = AuthService.authenticate_google_user(db, req)
    return StandardResponse.success_response(
        data=tokens,
        message="Google authentication successful."
    )


@router.post("/register", response_model=StandardResponse[TokenResponse], status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, request: Request, db: Session = Depends(get_db)):
    RateLimiter.check_rate_limit(request)
    tokens = AuthService.register_user(db, req)
    return StandardResponse.success_response(
        data=tokens,
        message="User registered successfully."
    )


@router.post("/login", response_model=StandardResponse[TokenResponse])
def login(req: UserLoginRequest, request: Request, db: Session = Depends(get_db)):
    RateLimiter.check_rate_limit(request)
    tokens = AuthService.authenticate_email_user(db, req)
    return StandardResponse.success_response(
        data=tokens,
        message="Login successful."
    )


@router.get("/me", response_model=StandardResponse[UserMeResponse])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    user_data = AuthService.get_me(current_user)
    return StandardResponse.success_response(
        data=user_data,
        message="User profile retrieved successfully."
    )


@router.put("/me", response_model=StandardResponse[UserMeResponse])
def update_current_user_profile(
    req: UserUpdateRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    user_data = AuthService.update_me(db, current_user, req)
    return StandardResponse.success_response(
        data=user_data,
        message="User profile updated successfully."
    )


@router.delete("/me", response_model=StandardResponse[dict])
def delete_current_user_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = AuthService.delete_me(db, current_user)
    return StandardResponse.success_response(
        data=result,
        message="User account deleted successfully."
    )
