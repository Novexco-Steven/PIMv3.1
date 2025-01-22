-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS handle_missing_profile_data ON user_profiles;
DROP TRIGGER IF EXISTS handle_missing_preferences_data ON user_preferences;
DROP FUNCTION IF EXISTS handle_missing_user_data CASCADE;
DROP FUNCTION IF EXISTS get_user_data_safe CASCADE;

-- Create function to initialize user data
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile jsonb;
  v_preferences jsonb;
  v_error jsonb;
BEGIN
  -- Create profile if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = NEW.user_id
  ) THEN
    INSERT INTO user_profiles (
      user_id,
      first_name,
      last_name,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      CASE WHEN NEW.user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'Admin' ELSE '' END,
      CASE WHEN NEW.user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' THEN 'User' ELSE '' END,
      NOW(),
      NOW()
    );
  END IF;

  -- Create preferences if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM user_preferences WHERE user_id = NEW.user_id
  ) THEN
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
      NEW.user_id,
      'light',
      'en',
      NULL,
      '{}'::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't prevent the operation
  INSERT INTO user_activity_logs (
    user_id,
    action,
    resource,
    details,
    created_at
  ) VALUES (
    NEW.user_id,
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
  RETURN NEW;
END;
$$;

-- Create triggers for data initialization
CREATE TRIGGER initialize_profile_data
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_data();

CREATE TRIGGER initialize_preferences_data
  BEFORE INSERT OR UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_data();

-- Function to repair missing user data
CREATE OR REPLACE FUNCTION repair_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Process each user in auth.users
  FOR v_user IN SELECT id FROM auth.users
  LOOP
    -- Create profile if missing
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = v_user.id
    ) THEN
      INSERT INTO user_profiles (
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
      );
    END IF;

    -- Create preferences if missing
    IF NOT EXISTS (
      SELECT 1 FROM user_preferences WHERE user_id = v_user.id
    ) THEN
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
        v_user.id,
        'light',
        'en',
        NULL,
        '{}'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;
END;
$$;

-- Repair any missing user data
SELECT repair_user_data();

-- Update admin user profile
UPDATE user_profiles
SET
  first_name = 'Admin',
  last_name = 'User',
  department = 'IT',
  position = 'System Administrator',
  bio = 'System administrator responsible for managing the Product Information Management system.',
  phone = '+1 (555) 123-4567',
  avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  updated_at = NOW()
WHERE user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00';

-- Update admin user preferences
UPDATE user_preferences
SET
  theme = 'light',
  language = 'en',
  timezone = 'UTC',
  notifications = jsonb_build_object(
    'product_updates', true,
    'task_assignments', true,
    'mentions', true,
    'system_alerts', true,
    'email_notifications', true,
    'push_notifications', true,
    'notification_sound', true
  ),
  dashboard_layout = jsonb_build_object(
    'show_quick_actions', true,
    'show_recent_activity', true,
    'show_statistics', true,
    'show_notifications', true,
    'show_tasks', true,
    'show_calendar', true,
    'layout_columns', 3,
    'default_view', 'grid',
    'widgets', jsonb_build_array(
      jsonb_build_object(
        'id', 'recent-products',
        'title', 'Recent Products',
        'position', 1,
        'enabled', true
      ),
      jsonb_build_object(
        'id', 'activity-feed',
        'title', 'Activity Feed',
        'position', 2,
        'enabled', true
      ),
      jsonb_build_object(
        'id', 'system-stats',
        'title', 'System Statistics',
        'position', 3,
        'enabled', true
      )
    )
  ),
  updated_at = NOW()
WHERE user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00';

-- Log successful update
INSERT INTO user_activity_logs (
  user_id,
  action,
  resource,
  details,
  created_at
) VALUES (
  'efbd2839-4674-4968-8947-c41a4ccc1c00',
  'UPDATE',
  'user_data',
  jsonb_build_object(
    'event', 'user_data_update',
    'changes', jsonb_build_object(
      'profile_ensured', true,
      'preferences_ensured', true,
      'error_handling_improved', true
    )
  ),
  NOW()
);