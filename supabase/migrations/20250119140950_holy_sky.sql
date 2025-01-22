-- Drop all existing user data initialization functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS initialize_user_data CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS repair_user_data CASCADE;
DROP FUNCTION IF EXISTS create_user_profile CASCADE;
DROP FUNCTION IF EXISTS create_user_preferences CASCADE;
DROP FUNCTION IF EXISTS assign_user_role CASCADE;
DROP FUNCTION IF EXISTS repair_missing_user_data CASCADE;

-- Create function to initialize user data
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_role_id uuid;
BEGIN
  -- Determine role (admin for specific user, viewer for others)
  IF NEW.id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN
    SELECT id INTO v_role_id FROM roles WHERE name = 'admin';
  ELSE
    SELECT id INTO v_role_id FROM roles WHERE name = 'viewer';
  END IF;

  -- Create profile
  INSERT INTO public.user_profiles (
    user_id,
    first_name,
    last_name,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    CASE WHEN NEW.id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'Admin' ELSE '' END,
    CASE WHEN NEW.id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'User' ELSE '' END,
    NOW(),
    NOW()
  );

  -- Create preferences
  INSERT INTO public.user_preferences (
    user_id,
    theme,
    language,
    timezone,
    notifications,
    dashboard_layout,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'light',
    'en',
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  );

  -- Assign role
  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (
      user_id,
      role_id,
      created_at
    ) VALUES (
      NEW.id,
      v_role_id,
      NOW()
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    INSERT INTO public.user_activity_logs (
      user_id,
      action,
      resource,
      details,
      created_at
    ) VALUES (
      NEW.id,
      'ERROR',
      'user_creation',
      jsonb_build_object(
        'error', SQLERRM,
        'state', SQLSTATE
      ),
      NOW()
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_data();

-- Function to repair existing user data
CREATE OR REPLACE FUNCTION repair_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_role_id uuid;
BEGIN
  -- Process each user in auth.users
  FOR v_user IN SELECT id FROM auth.users
  LOOP
    -- Determine role
    IF v_user.id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN
      SELECT id INTO v_role_id FROM roles WHERE name = 'admin';
    ELSE
      SELECT id INTO v_role_id FROM roles WHERE name = 'viewer';
    END IF;

    -- Create profile if missing
    INSERT INTO public.user_profiles (
      user_id,
      first_name,
      last_name,
      created_at,
      updated_at
    ) VALUES (
      v_user.id,
      CASE WHEN v_user.id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'Admin' ELSE '' END,
      CASE WHEN v_user.id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'User' ELSE '' END,
      NOW(),
      NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      updated_at = NOW();

    -- Create preferences if missing
    INSERT INTO public.user_preferences (
      user_id,
      theme,
      language,
      timezone,
      notifications,
      dashboard_layout,
      created_at,
      updated_at
    ) VALUES (
      v_user.id,
      'light',
      'en',
      NULL,
      '{}'::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
      updated_at = NOW();

    -- Assign role if missing
    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (
        user_id,
        role_id,
        created_at
      ) VALUES (
        v_user.id,
        v_role_id,
        NOW()
      ) ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Repair all existing user data
SELECT repair_user_data();

-- Ensure admin user exists in auth.users if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = 'efbd2839-4674-4968-8947-c41a4ccc1c00'
  ) THEN
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
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin User"}',
      'authenticated',
      'authenticated',
      '',
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;
END;
$$;