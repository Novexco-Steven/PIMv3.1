-- Ensure admin user exists with proper permissions
DO $$
DECLARE
  admin_role_id uuid;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';

  -- Ensure admin user exists
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    email_change,
    invited_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current
  ) VALUES (
    'efbd2839-4674-4968-8947-c41a4ccc1c00',
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email'],
      'is_super_admin', true
    ),
    jsonb_build_object(
      'name', 'Admin User',
      'role', 'admin'
    ),
    'authenticated',
    'service_role',
    '',
    now(),
    '',
    '',
    '',
    ''
  ) ON CONFLICT (id) DO UPDATE SET
    raw_app_meta_data = jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email'],
      'is_super_admin', true
    ),
    raw_user_meta_data = jsonb_build_object(
      'name', 'Admin User',
      'role', 'admin'
    ),
    role = 'service_role';

  -- Ensure admin role is assigned
  IF admin_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, created_at)
    VALUES ('efbd2839-4674-4968-8947-c41a4ccc1c00', admin_role_id, NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END;
$$;