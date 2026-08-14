from typing import Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.auth import User
from app.models.administration import ActivityLog
from app.middlewares.auth_middleware import require_roles
from app.services.settings_service import SettingsService
from app.schemas.common import StandardResponse

router = APIRouter()

class SettingUpdateRequest(BaseModel):
    value: Any
    description: Optional[str] = None

@router.get("", response_model=StandardResponse)
def get_all_settings(db: Session = Depends(get_db), current_user: User = Depends(require_roles(["super_admin"]))):
    settings = SettingsService.get_all_settings(db)
    data = [{"key": s.key, "value": s.value, "setting_type": s.setting_type, "description": s.description} for s in settings]
    return StandardResponse.success_response(data=data, message="System settings retrieved.")

@router.patch("/{key}", response_model=StandardResponse)
def update_setting(key: str, req: SettingUpdateRequest, request: Request, db: Session = Depends(get_db), current_user: User = Depends(require_roles(["super_admin"]))):
    old_value = SettingsService.set_setting(
        db=db,
        key=key,
        value=req.value,
        description=req.description,
        user_id=current_user.id
    )
    
    # Audit log
    ip_address = request.client.host if request.client else "unknown"
    log = ActivityLog(
        user_id=current_user.id,
        action=f"UPDATE_SYSTEM_SETTING",
        details={"key": key, "old_value": old_value, "new_value": req.value},
        ip_address=ip_address
    )
    db.add(log)
    db.commit()
    
    return StandardResponse.success_response(data=None, message="System setting updated.")
