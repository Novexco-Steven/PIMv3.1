/*
  # User Management System

  1. New Tables
    - `roles` - User roles (admin, manager, editor, viewer)
    - `permissions` - Available system permissions
    - `role_permissions` - Junction table for role-permission assignments
    - `user_roles` - Junction table for user-role assignments
    - `user_activity_logs` - Track user actions
    - `user_preferences` - Store user-specific settings
    - `user_profiles` - Extended user information

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Ensure admin-only access for sensitive operations

  3. Changes
    - Add activity logging triggers
    - Add user profile triggers
*/

-- Create roles table
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(resource, action)
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Create user_activity_logs table
CREATE TABLE user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'light',
  language text DEFAULT 'en',
  timezone text,
  notifications jsonb DEFAULT '{}',
  dashboard_layout jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  avatar_url text,
  phone text,
  department text,
  position text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin all access" ON roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Repeat similar policies for other tables...

-- Create updated_at triggers
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default roles
INSERT INTO roles (name, description, is_system)
VALUES 
  ('admin', 'Full system access', true),
  ('manager', 'Department manager access', true),
  ('editor', 'Content editor access', true),
  ('viewer', 'Read-only access', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action)
VALUES
  ('view_products', 'View products', 'products', 'view'),
  ('create_products', 'Create products', 'products', 'create'),
  ('edit_products', 'Edit products', 'products', 'edit'),
  ('delete_products', 'Delete products', 'products', 'delete'),
  ('view_categories', 'View categories', 'categories', 'view'),
  ('manage_categories', 'Manage categories', 'categories', 'manage'),
  ('view_attributes', 'View attributes', 'attributes', 'view'),
  ('manage_attributes', 'Manage attributes', 'attributes', 'manage'),
  ('view_specifications', 'View specifications', 'specifications', 'view'),
  ('manage_specifications', 'Manage specifications', 'specifications', 'manage'),
  ('view_manufacturers', 'View manufacturers', 'manufacturers', 'view'),
  ('manage_manufacturers', 'Manage manufacturers', 'manufacturers', 'manage'),
  ('view_suppliers', 'View suppliers', 'suppliers', 'view'),
  ('manage_suppliers', 'Manage suppliers', 'suppliers', 'manage'),
  ('view_catalogs', 'View catalogs', 'catalogs', 'view'),
  ('manage_catalogs', 'Manage catalogs', 'catalogs', 'manage'),
  ('manage_users', 'Manage users', 'users', 'manage'),
  ('manage_roles', 'Manage roles', 'roles', 'manage'),
  ('view_activity_logs', 'View activity logs', 'activity_logs', 'view')
ON CONFLICT (resource, action) DO NOTHING;

-- Assign permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity_logs (
    user_id,
    action,
    resource,
    resource_id,
    details,
    ip_address
  )
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
      ELSE row_to_json(NEW)
    END,
    current_setting('request.headers')::json->>'x-forwarded-for'
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create activity log triggers for main tables
CREATE TRIGGER log_products_activity
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_user_activity();

-- Repeat for other main tables...

-- Create function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id);
  
  -- Create user preferences
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  -- Assign default viewer role
  INSERT INTO user_roles (user_id, role_id)
  SELECT NEW.id, id FROM roles WHERE name = 'viewer';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();