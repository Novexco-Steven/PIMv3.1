-- Update admin user profile with more complete information
UPDATE user_profiles
SET
  first_name = 'Admin',
  last_name = 'User',
  department = 'IT',
  position = 'System Administrator',
  bio = 'System administrator responsible for managing the Product Information Management system.',
  phone = '+1 (555) 123-4567',
  updated_at = NOW()
WHERE user_id = 'efbd2839-4674-4968-8947-c41a4ccc1c00';

-- Update admin user preferences with more complete settings
UPDATE user_preferences
SET
  theme = 'light',
  language = 'en',
  timezone = 'UTC',
  notifications = jsonb_build_object(
    'product_updates', true,
    'task_assignments', true,
    'mentions', true,
    'system_alerts', true
  ),
  dashboard_layout = jsonb_build_object(
    'show_quick_actions', true,
    'show_recent_activity', true,
    'show_statistics', true,
    'show_notifications', true
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
      'profile_completed', true
    )
  ),
  NOW()
);