import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.db.session import SessionLocal
from app.api.v1.scraper import trigger_external_scraper, TriggerScraperRequest
from fastapi import BackgroundTasks
from app.models.auth import User

db = SessionLocal()
user = db.query(User).filter(User.email.ilike('%azlan%')).first()

req = TriggerScraperRequest(
    source_name="NCERT Official Metadata Scraper",
    target_class="1",
    subject_name="All Subjects",
    max_items=100,
    external_scraper_url="https://ncert.nic.in"
)

bt = BackgroundTasks()

try:
    print("Testing trigger_external_scraper...")
    res = trigger_external_scraper(req=req, background_tasks=bt, current_user=user, db=db)
    print("Result:", res.model_dump() if hasattr(res, 'model_dump') else res)
    db.commit()
    print("Tasks to run:", len(bt.tasks))
    if bt.tasks:
        func = bt.tasks[0].func
        args = bt.tasks[0].args
        print(f"Running task {func.__name__} with args {args}...")
        func(*args)
        print("Background task finished successfully.")
except Exception as e:
    import traceback
    traceback.print_exc()
