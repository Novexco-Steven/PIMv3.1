-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS initialize_user_data CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS ensure_user_data CASCADE;
DROP FUNCTION IF EXISTS repair_all_user_data CASCADE;

-- Create function to initialize user data without recursion
CREATE OR REPLACE FUNCTION initialize_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = p_user_id) THEN
    INSERT INTO user_profiles (
      user_id,
      first_name,
      last_name,
      department,
      position,
      bio,
      phone,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'Admin' ELSE '' END,
      CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'User' ELSE '' END,
      CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'IT' ELSE NULL END,
      CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'System Administrator' ELSE NULL END,
      CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' 
        THEN 'System administrator responsible for managing the Product Information Management system.'
        ELSE NULL END,
      CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN '+1 (555) 123-4567' ELSE NULL END,
      CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' 
        THEN 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        ELSE NULL END,
      NOW(),
      NOW()
    );
  END IF;

  -- Create preferences if they don't exist
  IF NOT EXISTS (SELECT 1 FROM user_preferences WHERE user_id = p_user_id) THEN
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
      CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'UTC' ELSE NULL END,
      CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' 
        THEN jsonb_build_object(
          'product_updates', true,
          'task_assignments', true,
          'mentions', true,
          'system_alerts', true
        )
        ELSE '{}'::jsonb END,
      CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' 
        THEN jsonb_build_object(
          'show_quick_actions', true,
          'show_recent_activity', true,
          'show_statistics', true,
          'show_notifications', true
        )
        ELSE '{}'::jsonb END,
      NOW(),
      NOW()
    );
  END IF;

  -- Assign role if none exists
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id) THEN
    INSERT INTO user_roles (user_id, role_id, created_at)
    SELECT 
      p_user_id,
      id,
      NOW()
    FROM roles 
    WHERE name = CASE 
      WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'admin'
      ELSE 'viewer'
    END;
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Log error but don't prevent the operation
  INSERT INTO user_activity_logs (
    user_id,
    action,
    resource,
    details,
    created_at
  ) VALUES (
    p_user_id,
    'ERROR',
    'user_data_initialization',
    jsonb_build_object(
      'error', SQLERRM,
      'state', SQLSTATE,
      'context', jsonb_build_object(
        'error_detail', SQLDETAIL,
        'error_hint', SQLHINT
      )
    ),
    NOW()
  );
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
  PERFORM initialize_user_data(NEW.id);
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