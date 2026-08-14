import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.db.session import SessionLocal
from app.services.kvs_ingestion_service import KVSIngestionService

db = SessionLocal()

try:
    print("Testing KVS Ingestion Service...")
    result = KVSIngestionService.sync_kvs_metadata(db)
    print("Result:", result.get("telemetry"))
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
