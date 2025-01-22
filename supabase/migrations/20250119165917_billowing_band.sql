-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_activity_logs;

-- Create function to get activity logs with proper joins and filtering
CREATE OR REPLACE FUNCTION get_activity_logs(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_resource text DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  action text,
  resource text,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz,
  user_email text,
  user_first_name text,
  user_last_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.user_id,
    l.action,
    l.resource,
    l.resource_id,
    l.details,
    l.ip_address,
    l.user_agent,
    l.created_at,
    u.email,
    p.first_name,
    p.last_name
  FROM user_activity_logs l
  LEFT JOIN auth.users u ON l.user_id = u.id
  LEFT JOIN user_profiles p ON l.user_id = p.user_id
  WHERE (
    p_search IS NULL OR
    u.email ILIKE '%' || p_search || '%' OR
    p.first_name ILIKE '%' || p_search || '%' OR
    p.last_name ILIKE '%' || p_search || '%' OR
    l.resource ILIKE '%' || p_search || '%'
  )
  AND (p_action IS NULL OR l.action = p_action)
  AND (p_resource IS NULL OR l.resource = p_resource)
  AND (p_start_date IS NULL OR l.created_at >= p_start_date)
  AND (p_end_date IS NULL OR l.created_at <= p_end_date)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION get_activity_logs TO authenticated;

-- Create index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON user_activity_logs(created_at DESC);

-- Create index for user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
ON user_activity_logs(user_id);

-- Create index for action if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_activity_logs_action
ON user_activity_logs(action);

-- Create index for resource if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource
ON user_activity_logs(resource);