-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS initialize_user_data CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;

-- Create function to initialize user data
CREATE OR REPLACE FUNCTION initialize_user_data(input_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_role_id uuid;
  viewer_role_id uuid;
  user_exists boolean;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = input_user_id
  ) INTO user_exists;

  IF NOT user_exists THEN
    RETURN;
  END IF;

  -- Get role IDs
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';

  -- Create or update profile
  INSERT INTO user_profiles (
    user_id,
    first_name,
    last_name,
    created_at,
    updated_at
  ) VALUES (
    input_user_id,
    CASE 
      WHEN input_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'Admin'
      ELSE ''
    END,
    CASE 
      WHEN input_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'User'
      ELSE ''
    END,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW()
    WHERE user_profiles.user_id = input_user_id;

  -- Create or update preferences
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
  ) ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW()
    WHERE user_preferences.user_id = input_user_id;

  -- Assign appropriate role
  IF input_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' AND admin_role_id IS NOT NULL THEN
    -- Assign admin role to admin user
    INSERT INTO user_roles (user_id, role_id, created_at)
    VALUES (input_user_id, admin_role_id, NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
  ELSIF viewer_role_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = input_user_id
  ) THEN
    -- Assign viewer role to other users if they have no role
    INSERT INTO user_roles (user_id, role_id, created_at)
    VALUES (input_user_id, viewer_role_id, NOW());
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
    PERFORM initialize_user_data(NEW.id);
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Initialize admin user data
SELECT initialize_user_data('efbd2839-4674-4968-8947-c41a4ccc1c00');

-- Initialize missing data for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT u.id
    FROM auth.users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    LEFT JOIN user_preferences f ON u.id = f.user_id
    LEFT JOIN user_roles r ON u.id = r.user_id
    WHERE p.user_id IS NULL 
       OR f.user_id IS NULL 
       OR r.user_id IS NULL
  LOOP
    PERFORM initialize_user_data(user_record.id);
  END LOOP;
END;
$$;