-- Update admin user role to service_role
UPDATE auth.users 
SET 
  role = 'service_role',
  raw_app_meta_data = jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email'],
    'is_super_admin', true
  ),
  raw_user_meta_data = jsonb_build_object(
    'name', 'Admin User',
    'role', 'admin'
  )
WHERE email = 'admin@example.com';

-- Ensure admin role is assigned
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT 
  u.id,
  r.id,
  NOW()
FROM auth.users u
CROSS JOIN roles r
WHERE u.email = 'admin@example.com'
AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;