import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", ".env"))

def main():
    db_url = os.getenv("DATABASE_URL")
    engine = create_engine(db_url, connect_args={"connect_timeout": 10})
    
    with engine.connect() as conn:
        print("=== ROLES IN SUPABASE DB ===")
        roles = conn.execute(text("SELECT id, name, description FROM roles;")).fetchall()
        for r in roles:
            print(f"ID: {r.id} | Name: '{r.name}' | Desc: {r.description}")

        print("\n=== USERS IN SUPABASE DB ===")
        users = conn.execute(text("SELECT u.id, u.email, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id;")).fetchall()
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Role: '{u.role_name}'")

if __name__ == "__main__":
    main()
