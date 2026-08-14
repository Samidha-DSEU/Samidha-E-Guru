import psycopg2

db_url = "postgresql://postgres.vigxqigzprmohgzetyzs:qLD0lgpKFAVJK0FY@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # 1. Check for duplicates and delete them, keeping the latest one
    cur.execute("""
        DELETE FROM resources
        WHERE id IN (
            SELECT id
            FROM (
                SELECT id,
                ROW_NUMBER() OVER( PARTITION BY source_type, external_url ORDER BY created_at DESC ) AS row_num
                FROM resources
            ) t
            WHERE t.row_num > 1
        );
    """)
    print(f"Deleted {cur.rowcount} duplicate rows.")

    # 2. Add Unique constraint
    cur.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'uq_source_type_external_url'
            ) THEN
                ALTER TABLE resources ADD CONSTRAINT uq_source_type_external_url UNIQUE (source_type, external_url);
            END IF;
        END $$;
    """)
    conn.commit()
    print("Successfully added unique constraint.")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
