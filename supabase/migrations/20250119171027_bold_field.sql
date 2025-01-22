-- Drop existing functions
DROP FUNCTION IF EXISTS get_activity_logs(integer, integer, text, text, text);
DROP FUNCTION IF EXISTS get_activity_logs(integer, integer, text, text, text, timestamptz, timestamptz);

-- Create function to get activity logs with proper joins and filtering
CREATE OR REPLACE FUNCTION get_activity_logs(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_resource text DEFAULT NULL
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
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    l.id,
    l.user_id,
    l.action::text,
    l.resource::text,
    l.resource_id,
    l.details,
    l.ip_address::text,
    l.user_agent::text,
    l.created_at,
    u.email::text,
    p.first_name::text,
    p.last_name::text
  FROM user_activity_logs l
  LEFT JOIN auth.users u ON l.user_id = u.id
  LEFT JOIN user_profiles p ON l.user_id = p.user_id
  WHERE (
    p_search IS NULL OR
    u.email ILIKE '%' || p_search || '%' OR
    p.first_name ILIKE '%' || p_search || '%' OR
    p.last_name ILIKE '%' || p_search || '%'
  )
  AND (p_action IS NULL OR l.action = p_action)
  AND (p_resource IS NULL OR l.resource = p_resource)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION get_activity_logs TO authenticated;