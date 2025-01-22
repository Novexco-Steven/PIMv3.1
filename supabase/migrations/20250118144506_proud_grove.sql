/*
  # Add sample specifications

  1. Changes
    - Insert sample specifications for common product attributes
    - No structural changes (tables already exist)
    - No policy changes (policies already exist)
*/

-- Insert sample specifications if they don't exist
INSERT INTO specifications (id, name)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Dimensions'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Weight'),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'Color')
ON CONFLICT (id) DO NOTHING;