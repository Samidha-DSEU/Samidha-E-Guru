import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.db.session import SessionLocal
from app.services.ncert_ingestion_service import NCERTIngestionService

db = SessionLocal()
try:
    print("Testing NCERT Scraper locally...")
    res = NCERTIngestionService.sync_ncert_metadata(db, "Class 1")
    print("Success:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
