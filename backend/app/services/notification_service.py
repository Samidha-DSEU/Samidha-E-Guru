import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import requests
from sqlalchemy.orm import Session
from app.models.auth import User, Role, VolunteerProfile

logger = logging.getLogger("samidha.notifications")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "SAMIDHA E-GURU <notifications@samidha.org>")

# In-memory cooldown tracker for chat emails: { conversation_key: datetime }
_chat_cooldowns = {}

class NotificationService:

    @staticmethod
    def _dispatch_email(to_email: str, subject: str, html_content: str):
        """
        Dispatches email via Resend API if API Key is set,
        otherwise logs cleanly to console in dev mode.
        """
        if RESEND_API_KEY:
            try:
                res = requests.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": FROM_EMAIL,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                    },
                    timeout=10,
                )
                logger.info(f"Email dispatched to {to_email} via Resend. Status: {res.status_code}")
            except Exception as e:
                logger.error(f"Failed to dispatch email to {to_email}: {str(e)}")
        else:
            logger.info(f"\n--- [DEV EMAIL SIMULATOR] ---\nTo: {to_email}\nSubject: {subject}\nBody:\n{html_content}\n-----------------------------")

    @classmethod
    def notify_admins_new_volunteer(cls, db: Session, volunteer_user: User):
        """Notifies all Admins and Super Admins about a new pending volunteer application."""
        admin_roles = db.query(Role).filter(Role.name.in_(["admin", "super_admin"])).all()
        admin_role_ids = [r.id for r in admin_roles]
        admins = db.query(User).filter(User.role_id.in_(admin_role_ids), User.is_active == True).all()

        profile_name = volunteer_user.profile.full_name if volunteer_user.profile else "Applicant"
        org_name = volunteer_user.volunteer_profile.organization if volunteer_user.volunteer_profile and volunteer_user.volunteer_profile.organization else "Not Specified"
        
        subject = f"⏳ New Volunteer Application: {profile_name}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0284c7;">New SAMIDHA Volunteer Verification Request</h2>
            <p>A new volunteer has applied for verification on <strong>SAMIDHA E-GURU</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr><td><strong>Applicant Name:</strong></td><td>{profile_name}</td></tr>
                <tr><td><strong>Email:</strong></td><td>{volunteer_user.email}</td></tr>
                <tr><td><strong>Organization:</strong></td><td>{org_name}</td></tr>
                <tr><td><strong>Applied At:</strong></td><td>{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</td></tr>
            </table>
            <p style="color: #eab308;">⚠️ <strong>Note:</strong> This request has a 3-day (72h) approval window. If unreviewed, the applicant account will be automatically purged after 72 hours.</p>
        </div>
        """

        for admin in admins:
            cls._dispatch_email(admin.email, subject, html)

    @classmethod
    def notify_volunteer_approved(cls, volunteer_user: User):
        """Notifies volunteer that their profile has been approved."""
        profile_name = volunteer_user.profile.full_name if volunteer_user.profile else "Volunteer"
        subject = "🎉 Congratulations! Your SAMIDHA Volunteer Account is Approved"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #16a34a;">Welcome to SAMIDHA Volunteer Team!</h2>
            <p>Dear {profile_name},</p>
            <p>Your volunteer application has been <strong>APPROVED</strong> by SAMIDHA Admins.</p>
            <p>You now have full access to upload study materials, host educational workshops, and mentor students.</p>
        </div>
        """
        cls._dispatch_email(volunteer_user.email, subject, html)

    @classmethod
    def notify_volunteer_rejected(cls, volunteer_user: User, reason: str):
        """Notifies volunteer of application rejection with reason."""
        profile_name = volunteer_user.profile.full_name if volunteer_user.profile else "Applicant"
        subject = "SAMIDHA Volunteer Application Status Update"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>SAMIDHA Volunteer Verification Update</h2>
            <p>Dear {profile_name},</p>
            <p>Thank you for applying to be a volunteer on SAMIDHA E-GURU.</p>
            <p>After review, your application was not approved for the following reason:</p>
            <blockquote style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px; color: #b91c1c;">
                {reason}
            </blockquote>
            <p>If you believe this is a mistake, please reach out to SAMIDHA support.</p>
        </div>
        """
        cls._dispatch_email(volunteer_user.email, subject, html)

    @classmethod
    def notify_admins_48h_reminder(cls, db: Session, expiring_volunteers: List[VolunteerProfile]):
        """Notifies Admins of volunteer applications expiring in 24 hours."""
        if not expiring_volunteers:
            return

        admin_roles = db.query(Role).filter(Role.name.in_(["admin", "super_admin"])).all()
        admin_role_ids = [r.id for r in admin_roles]
        admins = db.query(User).filter(User.role_id.in_(admin_role_ids), User.is_active == True).all()

        subject = f"⚠️ 24-Hour Expiration Warning: {len(expiring_volunteers)} Pending Volunteer Requests"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #dc2626;">Pending Volunteers Expiring in 24 Hours</h2>
            <p>The following volunteer applications have reached 48 hours and will auto-purge in 24 hours if unreviewed:</p>
            <ul>
                {"".join([f"<li><strong>{vp.user.email}</strong> (Applied: {vp.applied_at})</li>" for vp in expiring_volunteers if vp.user])}
            </ul>
            <p>Please log into Admin Control Panel to review them.</p>
        </div>
        """
        for admin in admins:
            cls._dispatch_email(admin.email, subject, html)

    @classmethod
    def notify_inactive_recipient_message(cls, sender_name: str, recipient_user: User, conversation_id: str):
        """Sends chat notification email if recipient has been inactive > 2 minutes with 15-minute cooldown."""
        now = datetime.now(timezone.utc)

        # Check online status (active within 2 minutes)
        if recipient_user.last_seen_at:
            time_diff = (now - recipient_user.last_seen_at.replace(tzinfo=timezone.utc)).total_seconds()
            if time_diff < 120:  # Online within 2 minutes
                return

        # Enforce 15-minute cooldown per conversation
        last_sent = _chat_cooldowns.get(conversation_id)
        if last_sent and (now - last_sent).total_seconds() < 900:  # 15 minutes = 900 seconds
            return

        _chat_cooldowns[conversation_id] = now

        subject = f"✉️ New Message from {sender_name} on SAMIDHA E-GURU"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h3 style="color: #0284c7;">You received a new message!</h3>
            <p>Hello,</p>
            <p><strong>{sender_name}</strong> sent you a mentorship message on SAMIDHA E-GURU.</p>
            <p>Log in to your account to reply.</p>
        </div>
        """
        cls._dispatch_email(recipient_user.email, subject, html)
