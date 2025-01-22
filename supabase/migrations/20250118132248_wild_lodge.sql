/*
  # Product Information Management System Schema

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `parent_id` (uuid, self-reference for hierarchy)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `sku` (text, unique, required)
      - `name` (text, required)
      - `description` (text)
      - `category_id` (uuid, foreign key)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `attributes`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `type` (text, required)
      - `required` (boolean)
      - `created_at` (timestamp)
    
    - `product_attributes`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `attribute_id` (uuid, foreign key)
      - `value` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `assets`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `url` (text, required)
      - `type` (text, required)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id),
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attributes table
CREATE TABLE attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create product_attributes table
CREATE TABLE product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  attribute_id uuid REFERENCES attributes(id) ON DELETE CASCADE,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assets table
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON attributes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON product_attributes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON assets
  FOR SELECT TO authenticated USING (true);

-- Add policies for insert, update, delete (restricted to authenticated users)
CREATE POLICY "Allow authenticated insert" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON categories
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON categories
  FOR DELETE TO authenticated USING (true);

-- Repeat for other tables
CREATE POLICY "Allow authenticated insert" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON products
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON products
  FOR DELETE TO authenticated USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_product_attributes_updated_at
  BEFORE UPDATE ON product_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();