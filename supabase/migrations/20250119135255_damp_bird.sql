-- Drop all existing policies for roles and role-related tables
DROP POLICY IF EXISTS "Allow authenticated read access" ON roles;
DROP POLICY IF EXISTS "Allow admin write access" ON roles;
DROP POLICY IF EXISTS "Allow authenticated read access" ON role_permissions;
DROP POLICY IF EXISTS "Allow authenticated read access" ON user_roles;

-- Create new, simplified policies without recursion
CREATE POLICY "Allow all read access" ON roles
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write access" ON roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Allow admin update access" ON roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Allow admin delete access" ON roles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Create policies for role_permissions
CREATE POLICY "Allow all read access" ON role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write access" ON role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Create policies for user_roles
CREATE POLICY "Allow all read access" ON user_roles
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write access" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Recreate handle_new_user function with better error handling and atomic operations
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  viewer_role_id uuid;
BEGIN
  -- Get viewer role ID
  SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';
  
  -- Create all required records in a single transaction
  BEGIN
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

    -- Assign viewer role
    IF viewer_role_id IS NOT NULL THEN
      INSERT INTO user_roles (
        user_id,
        role_id,
        created_at
      ) VALUES (
        NEW.id,
        viewer_role_id,
        NOW()
      );
    END IF;

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
        -- Continue with the transaction
        NULL;
  END;

  RETURN NEW;
END;
$$;

-- Ensure admin user exists with all required data
DO $$
DECLARE
  admin_role_id uuid;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';

  -- Create admin profile if it doesn't exist
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

  -- Create admin preferences if they don't exist
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
    INSERT INTO user_roles (
      user_id,
      role_id,
      created_at
    ) VALUES (
      'efbd2839-4674-4968-8947-c41a4ccc1c00',
      admin_role_id,
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
END;
$$;