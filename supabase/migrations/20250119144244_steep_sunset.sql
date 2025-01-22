-- Create function to handle user data queries with proper error handling
CREATE OR REPLACE FUNCTION get_user_data_safe(p_user_id uuid)
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
  -- Get user profile with error handling
  BEGIN
    SELECT row_to_json(p.*)::jsonb INTO v_profile
    FROM user_profiles p
    WHERE p.user_id = p_user_id;

    -- If no profile found, create one
    IF v_profile IS NULL THEN
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
      )
      RETURNING row_to_json(user_profiles.*)::jsonb INTO v_profile;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    v_error := jsonb_build_object(
      'code', SQLSTATE,
      'message', 'Error fetching user profile: ' || SQLERRM,
      'context', jsonb_build_object(
        'user_id', p_user_id,
        'error_detail', SQLDETAIL,
        'error_hint', SQLHINT
      )
    );
    RETURN QUERY SELECT NULL::jsonb, NULL::jsonb, v_error;
    RETURN;
  END;

  -- Get user preferences with error handling
  BEGIN
    SELECT row_to_json(p.*)::jsonb INTO v_preferences
    FROM user_preferences p
    WHERE p.user_id = p_user_id;

    -- If no preferences found, create them
    IF v_preferences IS NULL THEN
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
      )
      RETURNING row_to_json(user_preferences.*)::jsonb INTO v_preferences;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    v_error := jsonb_build_object(
      'code', SQLSTATE,
      'message', 'Error fetching user preferences: ' || SQLERRM,
      'context', jsonb_build_object(
        'user_id', p_user_id,
        'error_detail', SQLDETAIL,
        'error_hint', SQLHINT
      )
    );
    RETURN QUERY SELECT NULL::jsonb, NULL::jsonb, v_error;
    RETURN;
  END;

  -- Return the data
  RETURN QUERY SELECT v_profile, v_preferences, NULL::jsonb;
END;
$$;

-- Create function to handle missing user data
CREATE OR REPLACE FUNCTION handle_missing_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_data record;
BEGIN
  -- Get user ID from context
  v_user_id := current_setting('request.jwt.claims')::jsonb->>'sub';

  -- Ensure data exists
  SELECT * FROM get_user_data_safe(v_user_id) INTO v_data;

  -- Log any errors
  IF v_data.error_details IS NOT NULL THEN
    INSERT INTO user_activity_logs (
      user_id,
      action,
      resource,
      details,
      created_at
    ) VALUES (
      v_user_id,
      'ERROR',
      'user_data',
      v_data.error_details,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers to handle missing data
CREATE TRIGGER handle_missing_profile_data
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_missing_user_data();

CREATE TRIGGER handle_missing_preferences_data
  BEFORE INSERT OR UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_missing_user_data();

-- Update admin user data
SELECT * FROM get_user_data_safe('efbd2839-4674-4968-8947-c41a4ccc1c00');

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