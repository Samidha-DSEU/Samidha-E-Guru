from sqlalchemy.orm import Session
from app.models.resources import ResourceType, ResourceSource

DEFAULT_RESOURCE_TYPES = [
    {"name": "Book", "slug": "book"},
    {"name": "Notes", "slug": "notes"},
    {"name": "Solutions", "slug": "solutions"},
    {"name": "Question Bank", "slug": "question-bank"},
    {"name": "Sample Paper", "slug": "sample-paper"},
    {"name": "Previous Year Questions", "slug": "pyq"},
    {"name": "Video", "slug": "video"},
    {"name": "Article", "slug": "article"},
    {"name": "PDF", "slug": "pdf"},
    {"name": "Worksheet", "slug": "worksheet"},
]

DEFAULT_RESOURCE_SOURCES = [
    {"name": "NCERT", "url": "https://ncert.nic.in"},
    {"name": "DIKSHA", "url": "https://diksha.gov.in"},
    {"name": "NPTEL", "url": "https://nptel.ac.in"},
    {"name": "SWAYAM", "url": "https://swayam.gov.in"},
    {"name": "YouTube", "url": "https://youtube.com"},
    {"name": "SAMIDHA", "url": "https://samidha.org"},
    {"name": "Other", "url": None},
]


def seed_resource_types(db: Session) -> int:
    added = 0
    for rt_data in DEFAULT_RESOURCE_TYPES:
        existing = db.query(ResourceType).filter(ResourceType.slug == rt_data["slug"]).first()
        if not existing:
            rt = ResourceType(**rt_data)
            db.add(rt)
            added += 1
    db.commit()
    return added


def seed_resource_sources(db: Session) -> int:
    added = 0
    for rs_data in DEFAULT_RESOURCE_SOURCES:
        existing = db.query(ResourceSource).filter(ResourceSource.name == rs_data["name"]).first()
        if not existing:
            rs = ResourceSource(**rs_data)
            db.add(rs)
            added += 1
    db.commit()
    return added
