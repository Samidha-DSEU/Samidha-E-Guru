from sqlalchemy.orm import Session
from app.models.auth import Role

DEFAULT_ROLES = [
    {"name": "student", "description": "Student or general educational learner"},
    {"name": "volunteer", "description": "Verified SAMIDHA volunteer contributor"},
    {"name": "alumni", "description": "Graduated member providing career mentorship"},
    {"name": "admin", "description": "Platform administrator with content moderation rights"},
    {"name": "super_admin", "description": "Platform super administrator with unrestricted access"},
]


def seed_roles(db: Session) -> int:
    added = 0
    for role_data in DEFAULT_ROLES:
        existing = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing:
            role = Role(**role_data)
            db.add(role)
            added += 1
    db.commit()
    return added
