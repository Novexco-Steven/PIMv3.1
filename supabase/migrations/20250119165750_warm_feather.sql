-- Drop existing function
DROP FUNCTION IF EXISTS get_activity_logs;

-- Create function to get activity logs with proper joins and filtering
CREATE OR REPLACE FUNCTION get_activity_logs(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_resource text DEFAULT NULL
)
RETURNS SETOF user_activity_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
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
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION get_activity_logs TO authenticated;