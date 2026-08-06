import os
import sqlalchemy
from sqlalchemy import text

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.vigxqigzprmohgzetyzs:qLD0lgpKFAVJK0FY@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
)

def purge_non_admins():
    engine = sqlalchemy.create_engine(DATABASE_URL)
    try:
        with engine.begin() as conn:
            print("Executing database cleanup: Purging all non-admin records...")
            # Execute database purge retaining only admin & super_admin
            conn.execute(text("""
                DELETE FROM users 
                WHERE role_id IN (
                    SELECT id FROM roles WHERE name NOT IN ('admin', 'super_admin')
                );
            """))
            print("Successfully purged all non-admin data from PostgreSQL/Supabase DB!")
    except Exception as e:
        print(f"PostgreSQL Purge Notification: {e}")

if __name__ == "__main__":
    purge_non_admins()
