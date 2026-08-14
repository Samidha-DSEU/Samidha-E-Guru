import time
from typing import Dict, Tuple
from fastapi import HTTPException, status, Request

class RateLimiter:
    # Structure: { ip_address: (attempt_count, first_attempt_timestamp) }
    _limits: Dict[str, Tuple[int, float]] = {}
    MAX_ATTEMPTS = 5
    WINDOW_SECONDS = 15 * 60  # 15 minutes

    @classmethod
    def check_rate_limit(cls, request: Request):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        record = cls._limits.get(ip)
        if record:
            count, first_attempt = record
            if now - first_attempt > cls.WINDOW_SECONDS:
                # Reset window
                cls._limits[ip] = (1, now)
            else:
                if count >= cls.MAX_ATTEMPTS:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many authentication attempts. Please try again later."
                    )
                cls._limits[ip] = (count + 1, first_attempt)
        else:
            cls._limits[ip] = (1, now)
