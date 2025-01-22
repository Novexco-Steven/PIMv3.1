-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS ensure_profile_data_trigger ON user_profiles;
DROP TRIGGER IF EXISTS ensure_preferences_data_trigger ON user_preferences;
DROP TRIGGER IF EXISTS initialize_profile_data_on_insert ON user_profiles;
DROP TRIGGER IF EXISTS initialize_profile_data_on_update ON user_profiles;
DROP TRIGGER IF EXISTS initialize_preferences_data_on_insert ON user_preferences;
DROP TRIGGER IF EXISTS initialize_preferences_data_on_update ON user_preferences;
DROP TRIGGER IF EXISTS handle_missing_profile_data ON user_profiles;
DROP TRIGGER IF EXISTS handle_missing_preferences_data ON user_preferences;

DROP FUNCTION IF EXISTS initialize_user_data CASCADE;
DROP FUNCTION IF EXISTS initialize_user_data_on_insert CASCADE;
DROP FUNCTION IF EXISTS initialize_user_data_on_update CASCADE;
DROP FUNCTION IF EXISTS handle_user_data_access CASCADE;
DROP FUNCTION IF EXISTS ensure_user_data CASCADE;
DROP FUNCTION IF EXISTS initialize_missing_user_data CASCADE;
DROP FUNCTION IF EXISTS handle_missing_user_data CASCADE;

-- Create a function to safely initialize user data
CREATE OR REPLACE FUNCTION create_user_profile(input_user_id uuid)
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
    input_user_id,
    '',
    '',
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION create_user_preferences(input_user_id uuid)
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
    input_user_id,
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

CREATE OR REPLACE FUNCTION assign_viewer_role(input_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_role_id uuid;
BEGIN
  SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';
  
  IF viewer_role_id IS NOT NULL AND 
     NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = input_user_id) 
  THEN
    INSERT INTO user_roles (user_id, role_id, created_at)
    VALUES (input_user_id, viewer_role_id, NOW());
  END IF;
END;
$$;

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    PERFORM create_user_profile(NEW.id);
    PERFORM create_user_preferences(NEW.id);
    PERFORM assign_viewer_role(NEW.id);
  EXCEPTION
    WHEN OTHERS THEN
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Initialize data for admin user
DO $$
BEGIN
  PERFORM create_user_profile('efbd2839-4674-4968-8947-c41a4ccc1c00');
  PERFORM create_user_preferences('efbd2839-4674-4968-8947-c41a4ccc1c00');
  PERFORM assign_viewer_role('efbd2839-4674-4968-8947-c41a4ccc1c00');
END;
$$;

-- Create function to initialize missing data for all users
CREATE OR REPLACE FUNCTION repair_missing_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  missing_user RECORD;
BEGIN
  -- Find users missing profiles
  FOR missing_user IN 
    SELECT DISTINCT u.id
    FROM auth.users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE p.user_id IS NULL
  LOOP
    PERFORM create_user_profile(missing_user.id);
  END LOOP;

  -- Find users missing preferences
  FOR missing_user IN 
    SELECT DISTINCT u.id
    FROM auth.users u
    LEFT JOIN user_preferences p ON u.id = p.user_id
    WHERE p.user_id IS NULL
  LOOP
    PERFORM create_user_preferences(missing_user.id);
  END LOOP;

  -- Find users missing roles
  FOR missing_user IN 
    SELECT DISTINCT u.id
    FROM auth.users u
    LEFT JOIN user_roles r ON u.id = r.user_id
    WHERE r.user_id IS NULL
  LOOP
    PERFORM assign_viewer_role(missing_user.id);
  END LOOP;
END;
$$;

-- Repair missing data for all existing users
SELECT repair_missing_user_data();