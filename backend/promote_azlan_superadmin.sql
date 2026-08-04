-- ==============================================================================
-- SAMIDHA E-GURU: PROMOTE AZLAN ZIDAN TO SUPER ADMIN ROLE
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/vigxqigzprmohgzetyzs/sql)
-- ==============================================================================

-- 1. Ensure 'super_admin' role exists in roles table
INSERT INTO roles (id, name, description) 
SELECT gen_random_uuid(), 'super_admin', 'Super Administrator' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin');

-- 2. Promote Azlan Zidan account to Super Admin
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1) 
WHERE LOWER(email) LIKE '%azlan%' OR LOWER(email) LIKE '%zidan%' OR LOWER(email) LIKE '%feyaz%';

-- 3. Verify user role
SELECT u.id, u.email, r.name as role_name 
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE LOWER(u.email) LIKE '%azlan%' OR LOWER(u.email) LIKE '%zidan%' OR LOWER(u.email) LIKE '%feyaz%';
