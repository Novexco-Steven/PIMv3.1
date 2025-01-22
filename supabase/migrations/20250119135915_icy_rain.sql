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
DROP FUNCTION IF EXISTS create_user_profile CASCADE;
DROP FUNCTION IF EXISTS create_user_preferences CASCADE;
DROP FUNCTION IF EXISTS assign_viewer_role CASCADE;
DROP FUNCTION IF EXISTS repair_missing_user_data CASCADE;

-- Create function to initialize user data
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_role_id uuid;
BEGIN
  -- Get viewer role ID
  SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';

  -- Create profile
  INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NOW(),
    NOW()
  );

  -- Create preferences
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
    NEW.id,
    'light',
    'en',
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  );

  -- Assign viewer role if no roles exist
  IF viewer_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, created_at)
    VALUES (NEW.id, viewer_role_id, NOW());
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
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
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_data();

-- Initialize admin user data
DO $$
DECLARE
  admin_role_id uuid;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';

  -- Create admin profile
  INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    created_at,
    updated_at
  ) VALUES (
    'efbd2839-4674-4968-8947-c41a4ccc1c00',
    'Admin',
    'User',
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

  -- Create admin preferences
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
    'efbd2839-4674-4968-8947-c41a4ccc1c00',
    'light',
    'en',
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();

  -- Ensure admin role is assigned
  IF admin_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, created_at)
    VALUES ('efbd2839-4674-4968-8947-c41a4ccc1c00', admin_role_id, NOW())
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;