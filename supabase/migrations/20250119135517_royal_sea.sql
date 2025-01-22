-- Drop existing policies for user_roles
DROP POLICY IF EXISTS "Allow all read access" ON user_roles;
DROP POLICY IF EXISTS "Allow admin write access" ON user_roles;

-- Create new policies for user_roles without recursion
CREATE POLICY "Allow authenticated read access" ON user_roles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow admin write access" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );

CREATE POLICY "Allow admin update access" ON user_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );

CREATE POLICY "Allow admin delete access" ON user_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- Create function to ensure user data exists
CREATE OR REPLACE FUNCTION ensure_user_data(input_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_role_id uuid;
BEGIN
  -- Get viewer role ID
  SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';

  -- Create profile if it doesn't exist
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
    input_user_id,
    'light',
    'en',
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Assign viewer role if no roles exist
  IF viewer_role_id IS NOT NULL THEN
    INSERT INTO user_roles (
      user_id,
      role_id,
      created_at
    )
    SELECT
      input_user_id,
      viewer_role_id,
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = input_user_id
    );
  END IF;
END;
$$;

-- Create function to handle user data on access
CREATE OR REPLACE FUNCTION handle_user_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM ensure_user_data(OLD.user_id);
  RETURN OLD;
END;
$$;

-- Add triggers to ensure user data exists
DROP TRIGGER IF EXISTS ensure_profile_data_trigger ON user_profiles;
CREATE TRIGGER ensure_profile_data_trigger
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_data_access();

DROP TRIGGER IF EXISTS ensure_preferences_data_trigger ON user_preferences;
CREATE TRIGGER ensure_preferences_data_trigger
  AFTER INSERT OR UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_data_access();

-- Ensure admin user data exists
SELECT ensure_user_data('efbd2839-4674-4968-8947-c41a4ccc1c00');

-- Update handle_new_user function to use ensure_user_data
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM ensure_user_data(NEW.id);
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