-- Drop existing handle_new_user function and recreate it with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile if it doesn't exist
  INSERT INTO user_profiles (user_id, first_name, last_name)
  VALUES (NEW.id, '', '')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create user preferences if they don't exist
  INSERT INTO user_preferences (
    user_id,
    theme,
    language,
    timezone,
    notifications,
    dashboard_layout
  )
  VALUES (
    NEW.id,
    'light',
    'en',
    NULL,
    '{}',
    '{}'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign default viewer role if no role exists
  INSERT INTO user_roles (user_id, role_id)
  SELECT NEW.id, r.id 
  FROM roles r 
  WHERE r.name = 'viewer'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies for roles table
DROP POLICY IF EXISTS "Allow authenticated read access" ON roles;
DROP POLICY IF EXISTS "Allow admin all access" ON roles;

-- Create new, simplified policies for roles
CREATE POLICY "Allow authenticated read access" ON roles
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Allow admin write access" ON roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name = 'admin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN (
        SELECT id FROM roles WHERE name = 'admin'
      )
    )
  );

-- Create trigger for new user signup if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Insert admin user profile and preferences if they don't exist
INSERT INTO user_profiles (user_id, first_name, last_name)
VALUES ('efbd2839-4674-4968-8947-c41a4ccc1c00', 'Admin', 'User')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_preferences (user_id, theme, language)
VALUES ('efbd2839-4674-4968-8947-c41a4ccc1c00', 'light', 'en')
ON CONFLICT (user_id) DO NOTHING;

-- Ensure admin user has admin role
INSERT INTO user_roles (user_id, role_id)
SELECT 'efbd2839-4674-4968-8947-c41a4ccc1c00', r.id
FROM roles r
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;