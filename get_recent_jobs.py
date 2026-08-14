import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.db.session import SessionLocal
from app.models.administration import ScraperJob

db = SessionLocal()
jobs = db.query(ScraperJob).order_by(ScraperJob.created_at.desc()).limit(3).all()
for j in jobs:
    print(f"[{j.created_at}] Job {j.id}: {j.status}")
