import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.db.session import SessionLocal
from app.models.resources import Resource

def purge():
    db = SessionLocal()
    try:
        count = db.query(Resource).filter(Resource.source_type == "ncert").delete()
        db.commit()
        print(f"Successfully deleted {count} NCERT resources from the database.")
    except Exception as e:
        db.rollback()
        print(f"Error purging: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    purge()
