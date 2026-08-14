import time
import logging
from typing import Any, Optional, Dict
from sqlalchemy.orm import Session
from app.models.administration import SystemSetting

logger = logging.getLogger(__name__)

class SettingsService:
    # Memory cache structure: { "key": {"value": Any, "expires_at": float} }
    _cache: Dict[str, Dict[str, Any]] = {}
    TTL_SECONDS = 60.0

    @classmethod
    def get_setting(cls, db: Session, key: str, default: Any = None) -> Any:
        now = time.time()
        
        # Check cache
        cached = cls._cache.get(key)
        if cached and cached["expires_at"] > now:
            return cached["value"]
            
        # Fetch from DB
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            value = setting.value
        else:
            value = default
            
        # Update cache
        cls._cache[key] = {
            "value": value,
            "expires_at": now + cls.TTL_SECONDS
        }
        
        return value

    @classmethod
    def set_setting(cls, db: Session, key: str, value: Any, setting_type: str = "boolean", description: str = None, user_id=None):
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        old_value = None
        if setting:
            old_value = setting.value
            setting.value = value
            if description is not None:
                setting.description = description
            if user_id:
                setting.updated_by = user_id
        else:
            setting = SystemSetting(
                key=key,
                value=value,
                setting_type=setting_type,
                description=description,
                updated_by=user_id
            )
            db.add(setting)
            
        db.commit()
        
        # Invalidate / Update cache
        cls._cache[key] = {
            "value": value,
            "expires_at": time.time() + cls.TTL_SECONDS
        }
        
        return old_value

    @classmethod
    def get_all_settings(cls, db: Session) -> list:
        return db.query(SystemSetting).all()
