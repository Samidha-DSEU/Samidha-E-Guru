-- ==============================================================================
-- SAMIDHA E-GURU: STRICT SUPER ADMIN PROMOTION FOR AZLAN EMAIL ONLY
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/vigxqigzprmohgzetyzs/sql)
-- ==============================================================================

-- 1. Ensure 'super_admin' role exists
INSERT INTO roles (id, name, description) 
SELECT gen_random_uuid(), 'super_admin', 'Super Administrator' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin');

-- 2. Promote ONLY AZLAN accounts to Super Admin
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1) 
WHERE LOWER(email) = 'azlantalks4u@gmail.com' OR LOWER(email) LIKE '%azlan%';

-- 3. Demote Feyaz emails back to standard Admin
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1) 
WHERE (LOWER(email) LIKE '%feyaz%' OR LOWER(email) LIKE '%dseu%') 
  AND role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1);

-- 4. Verify user roles
SELECT u.id, u.email, r.name as role_name 
FROM users u 
JOIN roles r ON u.role_id = r.id;
