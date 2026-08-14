import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.db.session import SessionLocal
from app.models.administration import ScraperJob

db = SessionLocal()
jobs = db.query(ScraperJob).filter(ScraperJob.status == "running").all()
for j in jobs:
    print(f"Running Job: {j.id}")
print(f"Total running: {len(jobs)}")
