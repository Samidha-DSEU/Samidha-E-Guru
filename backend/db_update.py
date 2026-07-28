from app.db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    db.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255) NULL;'))
    db.execute(text('TRUNCATE TABLE users CASCADE;'))
    db.commit()
    print("DB updated and users truncated.")
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
