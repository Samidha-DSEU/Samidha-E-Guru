import os
import sqlalchemy
from sqlalchemy import text

DATABASE_URL = "postgresql://postgres.vigxqigzprmohgzetyzs:qLD0lgpKFAVJK0FY@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

engine = sqlalchemy.create_engine(DATABASE_URL)

def truncate_db():
    try:
        with engine.begin() as conn:
            print("Truncating tables...")
            # Truncate users which will cascade to profiles and sessions
            conn.execute(text("TRUNCATE TABLE users CASCADE;"))
            print("Successfully wiped all user data!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    truncate_db()
