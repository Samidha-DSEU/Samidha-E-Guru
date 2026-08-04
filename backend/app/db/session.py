import os
import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

logger = logging.getLogger("db")

class Base(DeclarativeBase):
    pass

# Primary PostgreSQL URL vs SQLite Fallback for instant zero-config testing
PRIMARY_DATABASE_URL = settings.DATABASE_URL
SQLITE_FALLBACK_URL = "sqlite:///./samidha_local.db"

def ensure_schema_migrations(engine):
    """
    Safely executes DDL migrations so missing columns on existing tables
    are added automatically without requiring manual alembic migrations or dropping tables.
    """
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;",
        "ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'PENDING';",
        "ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;",
        "ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);",
        "ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;",
        "ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;",
        "ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;",
        "ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS target_class VARCHAR(50);",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS subject_name VARCHAR(100);",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS resource_category VARCHAR(50);",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'samidha';",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS rating_sum INTEGER DEFAULT 0;",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS rating_avg FLOAT DEFAULT 0.0;",
        "ALTER TABLE resources ALTER COLUMN chapter_id DROP NOT NULL;",
        "ALTER TABLE resources ALTER COLUMN resource_type_id DROP NOT NULL;",
        "ALTER TABLE resources ALTER COLUMN resource_source_id DROP NOT NULL;",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'online';",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time VARCHAR(50);",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending';",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS rejection_reason TEXT;",
        "ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);",
        "ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS class_or_college VARCHAR(255);",
        "ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);",
        "ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS address TEXT;"
    ]
    with engine.connect() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception as e:
                logger.debug(f"Auto migration statement skipped: {stmt} ({e})")

def get_engine():
    try:
        # Try primary PostgreSQL connection
        engine = create_engine(
            PRIMARY_DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
        # Test connection
        with engine.connect() as conn:
            pass
        logger.info("Successfully connected to Primary PostgreSQL Database.")
        ensure_schema_migrations(engine)
        return engine
    except Exception as e:
        logger.warning(f"Primary PostgreSQL connection failed ({e}). Falling back to SQLite local database.")
        engine = create_engine(
            SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )
        ensure_schema_migrations(engine)
        return engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
