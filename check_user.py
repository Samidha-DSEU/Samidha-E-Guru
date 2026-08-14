import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.db.session import SessionLocal
from app.models.auth import User

db = SessionLocal()
u = db.query(User).filter(User.email.ilike('%azlan%')).first()
print(u.role.name if u and u.role else 'Not found')
