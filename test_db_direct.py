import sqlite3
import psycopg2
import os

# Connect to supabase
db_url = "postgresql://postgres.tyetevgoxqivtgygcexs:Bhuvi%40123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT id, title, target_class, subject_name FROM resources LIMIT 20;")
    rows = cur.fetchall()
    print(f"Fetched {len(rows)} rows.")
    for r in rows:
        print(f"ID: {r[0]}, Title: {r[1]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
