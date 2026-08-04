-- ==============================================================================
-- SAMIDHA E-GURU: STRICT SUPER ADMIN PROMOTION FOR AZLAN ZIDAN ONLY
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/vigxqigzprmohgzetyzs/sql)
-- ==============================================================================

-- 1. Ensure 'super_admin' role exists
INSERT INTO roles (id, name, description) 
SELECT gen_random_uuid(), 'super_admin', 'Super Administrator' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin');

-- 2. Promote ONLY AZLAN ZIDAN to Super Admin
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1) 
WHERE LOWER(email) = 'azlantalks4u@gmail.com';

-- 3. Reset Feyaz account to standard Admin role
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1) 
WHERE LOWER(email) = 'feyazkhan3800@gmail.com';

-- 4. Verify user roles
SELECT u.id, u.email, r.name as role_name 
FROM users u 
JOIN roles r ON u.role_id = r.id;
