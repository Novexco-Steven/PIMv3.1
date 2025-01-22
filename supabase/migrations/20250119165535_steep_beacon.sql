-- Create function to get user activity logs with proper joins
CREATE OR REPLACE FUNCTION get_activity_logs(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
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
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create policy to allow reading activity logs
CREATE POLICY "Allow authenticated read access" ON user_activity_logs
  FOR SELECT TO authenticated
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
ON user_activity_logs(created_at DESC);