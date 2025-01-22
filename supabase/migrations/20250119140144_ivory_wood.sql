-- Drop all existing user data initialization functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS initialize_user_data CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS repair_user_data CASCADE;

-- Create function to initialize user profile
CREATE OR REPLACE FUNCTION create_user_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'Admin' ELSE '' END,
    CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'User' ELSE '' END,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Create function to initialize user preferences
CREATE OR REPLACE FUNCTION create_user_preferences(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_preferences (
    user_id,
    theme,
    language,
    timezone,
    notifications,
    dashboard_layout,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    'light',
    'en',
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Create function to assign user role
CREATE OR REPLACE FUNCTION assign_user_role(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id uuid;
BEGIN
  -- Determine role (admin for specific user, viewer for others)
  IF p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN
    SELECT id INTO v_role_id FROM roles WHERE name = 'admin';
  ELSE
    SELECT id INTO v_role_id FROM roles WHERE name = 'viewer';
  END IF;

  -- Assign role if found and not already assigned
  IF v_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, created_at)
    VALUES (p_user_id, v_role_id, NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END;
$$;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    -- Initialize all user data
    PERFORM create_user_profile(NEW.id);
    PERFORM create_user_preferences(NEW.id);
    PERFORM assign_user_role(NEW.id);
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't prevent user creation
      INSERT INTO user_activity_logs (
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
  END;
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to repair missing user data
CREATE OR REPLACE FUNCTION repair_missing_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_record RECORD;
BEGIN
  -- Process users missing any required data
  FOR v_user_record IN 
    SELECT DISTINCT u.id
    FROM auth.users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN user_preferences f ON u.id = f.user_id
    LEFT JOIN user_roles r ON u.id = r.user_id
    WHERE p.user_id IS NULL 
       OR f.user_id IS NULL 
       OR r.user_id IS NULL
  LOOP
    PERFORM create_user_profile(v_user_record.id);
    PERFORM create_user_preferences(v_user_record.id);
    PERFORM assign_user_role(v_user_record.id);
  END LOOP;
END;
$$;

-- Initialize admin user data
DO $$
BEGIN
  PERFORM create_user_profile('efbd2839-4674-4968-8947-c41a4ccc1c00');
  PERFORM create_user_preferences('efbd2839-4674-4968-8947-c41a4ccc1c00');
  PERFORM assign_user_role('efbd2839-4674-4968-8947-c41a4ccc1c00');
END;
$$;

-- Repair any missing user data
SELECT repair_missing_user_data();