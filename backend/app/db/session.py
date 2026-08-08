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
    and database extensions (e.g. pgvector) are created automatically on both PostgreSQL and SQLite.
    """
    is_sqlite = engine.dialect.name == "sqlite"

    with engine.connect() as conn:
        if not is_sqlite:
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
            except Exception as e:
                logger.debug(f"Extension vector skipped: {e}")

        # List of columns to ensure (table, column, postgres_type, default_val)
        columns_to_add = [
            ("users", "last_seen_at", "TIMESTAMPTZ", None),
            ("volunteer_profiles", "approval_status", "VARCHAR(20)", "'PENDING'"),
            ("volunteer_profiles", "applied_at", "TIMESTAMPTZ", "CURRENT_TIMESTAMP"),
            ("volunteer_profiles", "approved_at", "TIMESTAMPTZ", None),
            ("volunteer_profiles", "approved_by", "UUID REFERENCES users(id)", None),
            ("volunteer_profiles", "rejected_at", "TIMESTAMPTZ", None),
            ("volunteer_profiles", "rejection_reason", "TEXT", None),
            ("volunteer_profiles", "expires_at", "TIMESTAMPTZ", None),
            ("volunteer_profiles", "reminder_sent_at", "TIMESTAMPTZ", None),
            ("resources", "target_class", "VARCHAR(50)", None),
            ("resources", "subject_name", "VARCHAR(100)", None),
            ("resources", "resource_category", "VARCHAR(50)", None),
            ("resources", "source_type", "VARCHAR(50)", "'samidha'"),
            ("resources", "rating_sum", "INTEGER", "0"),
            ("resources", "rating_count", "INTEGER", "0"),
            ("resources", "rating_avg", "FLOAT", "0.0"),
            ("resources", "deletion_reason", "TEXT", None),
            ("events", "mode", "VARCHAR(50)", "'online'"),
            ("events", "whatsapp_group_url", "TEXT", None),
            ("events", "start_time", "VARCHAR(50)", None),
            ("events", "verification_status", "VARCHAR(50)", "'pending'"),
            ("events", "rejection_reason", "TEXT", None),
            ("events", "event_status", "VARCHAR(50)", "'active'"),
            ("events", "is_free", "BOOLEAN", "TRUE"),
            ("scraper_jobs", "class_code", "VARCHAR(20)", None),
            ("scraper_jobs", "total_subjects_found", "INTEGER", "0"),
            ("scraper_jobs", "total_chapters_found", "INTEGER", "0"),
            ("scraper_jobs", "scraped_success_count", "INTEGER", "0"),
            ("scraper_jobs", "scraped_failed_count", "INTEGER", "0"),
            ("scraper_jobs", "duration_seconds", "FLOAT", "0.0"),
            ("scraper_jobs", "telemetry_details", "JSONB" if not is_sqlite else "JSON", None),
            ("scraper_jobs", "scraped_sheet", "JSONB" if not is_sqlite else "JSON", None),
            ("event_registrations", "full_name", "VARCHAR(255)", None),
            ("event_registrations", "class_or_college", "VARCHAR(255)", None),
            ("event_registrations", "mobile_number", "VARCHAR(50)", None),
            ("event_registrations", "address", "TEXT", None),
        ]

        for table, col, col_type, default_val in columns_to_add:
            try:
                if is_sqlite:
                    # Inspect existing columns in SQLite table
                    res = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                    existing_cols = [row[1] for row in res]
                    if col not in existing_cols:
                        sq_type = col_type.replace("TIMESTAMPTZ", "TEXT").replace("JSONB", "JSON").replace("VARCHAR(20)", "TEXT").replace("VARCHAR(50)", "TEXT").replace("VARCHAR(100)", "TEXT").replace("VARCHAR(255)", "TEXT").replace("UUID REFERENCES users(id)", "TEXT")
                        def_str = f" DEFAULT {default_val}" if default_val else ""
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {sq_type}{def_str};"))
                        conn.commit()
                else:
                    def_str = f" DEFAULT {default_val}" if default_val else ""
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}{def_str};"))
                    conn.commit()
            except Exception as e:
                logger.debug(f"Column migration skipped for {table}.{col}: {e}")

def get_engine():
    try:
        # Try primary PostgreSQL connection with fast 3s connection timeout
        engine = create_engine(
            PRIMARY_DATABASE_URL,
            connect_args={"connect_timeout": 3},
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
