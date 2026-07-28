import os
import logging
from typing import Generator
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

logger = logging.getLogger("db")

class Base(DeclarativeBase):
    pass

# Primary PostgreSQL URL vs SQLite Fallback for instant zero-config testing
PRIMARY_DATABASE_URL = settings.DATABASE_URL
SQLITE_FALLBACK_URL = "sqlite:///./samidha_local.db"

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
        return engine
    except Exception as e:
        logger.warning(f"Primary PostgreSQL connection failed ({e}). Falling back to SQLite local database.")
        engine = create_engine(
            SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )
        return engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
