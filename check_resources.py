import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.db.session import SessionLocal
from app.models.resources import Resource

db = SessionLocal()
print(f"Total Resources: {db.query(Resource).count()}")
