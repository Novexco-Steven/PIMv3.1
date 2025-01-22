/*
  # Add sample products and categories

  1. New Data
    - Sample categories for electronics
    - Sample products with basic information
    - Sample assets for products with proper type field

  2. Changes
    - Insert initial categories
    - Insert sample products
    - Insert sample product images with required type field
*/

-- Insert sample categories
INSERT INTO categories (id, name, description)
VALUES 
  ('98a4f734-d6d9-4b0c-9a0f-c4b58e09e8d7', 'Storage', 'Storage devices and solutions'),
  ('b5c7c94a-5a38-4a44-b91e-c0a8c0e1e389', 'Electronics', 'Electronic devices and accessories')
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, sku, name, description, category_id, status)
VALUES 
  (
    '123e4567-e89b-12d3-a456-426614174000',
    'WD-1TB-BLK',
    'WD 1TB My Passport',
    'Portable External Hard Drive',
    '98a4f734-d6d9-4b0c-9a0f-c4b58e09e8d7',
    'active'
  ),
  (
    '987fcdeb-51a2-43f7-9135-7afc9d1a8b2e',
    'SSD-500-RGB',
    'RGB SSD 500GB',
    'High-performance RGB Gaming SSD',
    '98a4f734-d6d9-4b0c-9a0f-c4b58e09e8d7',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample assets
INSERT INTO assets (product_id, url, type, usage_type, alt_tag, is_default)
VALUES 
  (
    '123e4567-e89b-12d3-a456-426614174000',
    'https://images.unsplash.com/photo-1531492746076-161ca9bcad58',
    'image',
    'main',
    'WD 1TB My Passport External Hard Drive',
    true
  ),
  (
    '987fcdeb-51a2-43f7-9135-7afc9d1a8b2e',
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b',
    'image',
    'main',
    'RGB SSD 500GB Front View',
    true
  )
ON CONFLICT DO NOTHING;