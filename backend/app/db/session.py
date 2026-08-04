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
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS deletion_reason TEXT;",
        "ALTER TABLE resources ALTER COLUMN chapter_id DROP NOT NULL;",
        "ALTER TABLE resources ALTER COLUMN resource_type_id DROP NOT NULL;",
        "ALTER TABLE resources ALTER COLUMN resource_source_id DROP NOT NULL;",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'online';",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time VARCHAR(50);",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending';",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS rejection_reason TEXT;",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS event_status VARCHAR(50) DEFAULT 'active';",
        "ALTER TABLE events ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);",
        "ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS class_or_college VARCHAR(255);",
        "ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(50);",
        "ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS address TEXT;",
        """CREATE TABLE IF NOT EXISTS mentorship_requests (
            id UUID PRIMARY KEY,
            requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            alumni_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            topic VARCHAR(255) NOT NULL,
            message_note TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );""",
        """CREATE TABLE IF NOT EXISTS mentorship_messages (
            id UUID PRIMARY KEY,
            request_id UUID NOT NULL REFERENCES mentorship_requests(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );""",
        """INSERT INTO roles (id, name, description) 
           SELECT gen_random_uuid(), 'super_admin', 'Super Administrator' 
           WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin');""",
        """UPDATE users 
           SET role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1) 
           WHERE LOWER(email) = 'azlantalks4u@gmail.com' OR LOWER(email) LIKE '%azlan%';""",
        """UPDATE users 
           SET role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1) 
           WHERE (LOWER(email) LIKE '%feyaz%' OR LOWER(email) LIKE '%dseu%') 
             AND role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1);"""
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
