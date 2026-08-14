import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.api.v1.scraper import require_roles
from app.models.auth import User, Role
from app.db.session import SessionLocal

db = SessionLocal()
user = db.query(User).filter(User.email.ilike('%azlan%')).first()

# Mock the dependency
async def override_require_roles():
    return user

app.dependency_overrides[require_roles(["super_admin", "admin"])] = override_require_roles
# Actually require_roles returns a closure, so overriding it is tricky.
# Let's override `get_current_user` instead.
from app.api.v1.auth import get_current_user
app.dependency_overrides[get_current_user] = lambda: user

client = TestClient(app)

payload = {
  "source_name": "NCERT Official Metadata Scraper",
  "target_class": "1",
  "subject_name": "All Subjects",
  "max_items": 100,
  "external_scraper_url": "https://ncert.nic.in"
}

print("Sending POST request to /api/v1/scraper/trigger...")
response = client.post("/api/v1/scraper/trigger", json=payload)
print(f"Status Code: {response.status_code}")
print(f"Response Body: {response.json()}")

