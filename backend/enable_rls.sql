-- ==============================================================================
-- SAMIDHA E-GURU: AUTOMATED ROW LEVEL SECURITY (RLS) ENABLER & SECURITY FIX
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/vigxqigzprmohgzetyzs/sql)
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- Verify RLS Status for all tables in public schema
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
