-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS initialize_profile_data ON user_profiles;
DROP TRIGGER IF EXISTS initialize_preferences_data ON user_preferences;
DROP FUNCTION IF EXISTS initialize_user_data CASCADE;
DROP FUNCTION IF EXISTS repair_user_data CASCADE;

-- Create function to ensure user data exists
CREATE OR REPLACE FUNCTION ensure_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile if it doesn't exist
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
  )
  ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();

  -- Create preferences if they don't exist
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
        'system_alerts', true,
        'email_notifications', true,
        'push_notifications', true,
        'notification_sound', true
      )
      ELSE '{}'::jsonb END,
    CASE WHEN p_user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00' 
      THEN jsonb_build_object(
        'show_quick_actions', true,
        'show_recent_activity', true,
        'show_statistics', true,
        'show_notifications', true,
        'show_tasks', true,
        'show_calendar', true,
        'layout_columns', 3,
        'default_view', 'grid'
      )
      ELSE '{}'::jsonb END,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    updated_at = NOW();

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
  PERFORM ensure_user_data(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure admin user data exists
SELECT ensure_user_data('efbd2839-4674-4968-8947-c41a4ccc1c00');

-- Create function to repair all user data
CREATE OR REPLACE FUNCTION repair_all_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT id FROM auth.users
  LOOP
    PERFORM ensure_user_data(v_user.id);
  END LOOP;
END;
$$;

-- Repair all user data
SELECT repair_all_user_data();