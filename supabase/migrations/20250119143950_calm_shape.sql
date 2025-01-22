-- Create function to handle database queries with proper error handling
CREATE OR REPLACE FUNCTION handle_db_query(
  query_name text,
  INOUT result jsonb DEFAULT NULL,
  INOUT error_details jsonb DEFAULT NULL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Wrap the query execution in exception handling
  BEGIN
    CASE query_name
      WHEN 'get_user_profile' THEN
        SELECT row_to_json(p.*)::jsonb INTO result
        FROM user_profiles p
        WHERE p.user_id = current_setting('request.jwt.claims')::jsonb->>'sub';
        
      WHEN 'get_user_preferences' THEN
        SELECT row_to_json(p.*)::jsonb INTO result
        FROM user_preferences p
        WHERE p.user_id = current_setting('request.jwt.claims')::jsonb->>'sub';
        
      ELSE
        error_details := jsonb_build_object(
          'code', 'INVALID_QUERY',
          'message', 'Invalid query name provided',
          'query', query_name
        );
        RETURN;
    END CASE;

    -- Handle case where no data is found
    IF result IS NULL THEN
      error_details := jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'No data found for the given query',
        'query', query_name
      );
      RETURN;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Log the error and return error details
    error_details := jsonb_build_object(
      'code', SQLSTATE,
      'message', SQLERRM,
      'query', query_name,
      'context', jsonb_build_object(
        'error_detail', COALESCE(SQLDETAIL, ''),
        'error_hint', COALESCE(SQLHINT, ''),
        'error_context', COALESCE(SQLCONTEXT, '')
      )
    );
    
    -- Log error to activity logs
    INSERT INTO user_activity_logs (
      user_id,
      action,
      resource,
      details,
      created_at
    ) VALUES (
      current_setting('request.jwt.claims')::jsonb->>'sub',
      'ERROR',
      'database_query',
      error_details,
      NOW()
    );
  END;
END;
$$;

-- Create helper functions for common queries with proper error handling
CREATE OR REPLACE FUNCTION get_user_data(user_id uuid)
RETURNS TABLE (
  profile jsonb,
  preferences jsonb,
  error_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile jsonb;
  v_preferences jsonb;
  v_error jsonb;
BEGIN
  -- Get user profile
  SELECT * FROM handle_db_query('get_user_profile') INTO v_profile, v_error;
  IF v_error IS NOT NULL THEN
    RETURN QUERY SELECT NULL::jsonb, NULL::jsonb, v_error;
    RETURN;
  END IF;

  -- Get user preferences
  SELECT * FROM handle_db_query('get_user_preferences') INTO v_preferences, v_error;
  IF v_error IS NOT NULL THEN
    RETURN QUERY SELECT NULL::jsonb, NULL::jsonb, v_error;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_profile, v_preferences, NULL::jsonb;
END;
$$;

-- Update admin user profile with complete information
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

-- Update admin user preferences with complete settings
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

-- Log the profile update
INSERT INTO user_activity_logs (
  user_id,
  action,
  resource,
  resource_id,
  details,
  created_at
) VALUES (
  'efbd2839-4674-4968-8947-c41a4ccc1c00',
  'UPDATE',
  'user_profile',
  'efbd2839-4674-4968-8947-c41a4ccc1c00',
  jsonb_build_object(
    'event', 'profile_update',
    'changes', jsonb_build_object(
      'department', 'IT',
      'position', 'System Administrator',
      'profile_completed', true,
      'preferences_updated', true,
      'notification_settings_configured', true,
      'dashboard_layout_configured', true
    )
  ),
  NOW()
);