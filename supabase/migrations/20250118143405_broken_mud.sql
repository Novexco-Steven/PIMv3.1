/*
  # Fix admin user creation

  1. Changes
    - Drop previous admin user if exists
    - Create new admin user with proper Supabase auth schema
    - Set proper user metadata and flags
*/

-- First, ensure we remove any existing admin user to avoid conflicts
DELETE FROM auth.users WHERE email = 'admin@example.com';

-- Insert admin user with proper Supabase auth setup
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  email_change,
  invited_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current
) VALUES (
  'efbd2839-4674-4968-8947-c41a4ccc1c00',
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin User"}',
  'authenticated',
  'authenticated',
  '',
  now(),
  '',
  '',
  '',
  ''
);