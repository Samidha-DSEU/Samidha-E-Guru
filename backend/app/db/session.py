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
        "ALTER TABLE volunteer_profiles ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;"
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
