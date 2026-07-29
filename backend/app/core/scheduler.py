import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.auth import User, VolunteerProfile, ApprovalStatus
from app.services.notification_service import NotificationService

logger = logging.getLogger("samidha.scheduler")


def mask_email(email: str) -> str:
    """Masks email for privacy in audit logs e.g. fe***z@gmail.com"""
    try:
        parts = email.split("@")
        name, domain = parts[0], parts[1]
        if len(name) <= 2:
            masked_name = name[0] + "*"
        else:
            masked_name = name[0] + "*" * (len(name) - 2) + name[-1]
        return f"{masked_name}@{domain}"
    except Exception:
        return "***@***.com"


def purge_expired_volunteers():
    """
    Hourly worker task:
    Finds PENDING volunteers created > 72 hours ago, logs audit entry,
    and hard deletes the user record (CASCADE).
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        expired_profiles = (
            db.query(VolunteerProfile)
            .filter(
                VolunteerProfile.approval_status == ApprovalStatus.PENDING.value,
                VolunteerProfile.expires_at <= now
            )
            .all()
        )

        for vp in expired_profiles:
            user = vp.user
            if user:
                masked = mask_email(user.email)
                logger.info(f"[PURGE AUDIT LOG] Purged expired volunteer | User ID: {user.id} | Email: {masked} | Applied: {vp.applied_at} | Purged: {now}")
                db.delete(user)

        if expired_profiles:
            db.commit()
            logger.info(f"Purged {len(expired_profiles)} expired volunteer accounts successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during expired volunteer purge task: {str(e)}")
    finally:
        db.close()


def send_48h_admin_reminders():
    """
    Hourly worker task:
    Finds PENDING volunteers created > 48 hours ago where no reminder has been sent yet,
    dispatches Admin notification, and marks reminder_sent_at.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(hours=48)
        
        pending_reminders = (
            db.query(VolunteerProfile)
            .filter(
                VolunteerProfile.approval_status == ApprovalStatus.PENDING.value,
                VolunteerProfile.applied_at <= threshold,
                VolunteerProfile.reminder_sent_at.is_(None)
            )
            .all()
        )

        if pending_reminders:
            NotificationService.notify_admins_48h_reminder(db, pending_reminders)
            for vp in pending_reminders:
                vp.reminder_sent_at = now
            db.commit()
            logger.info(f"Dispatched 48h expiration warning for {len(pending_reminders)} volunteer applications.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during 48h admin reminder task: {str(e)}")
    finally:
        db.close()
