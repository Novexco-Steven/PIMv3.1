/*
  # Add manufacturers and product manufacturers support

  1. New Tables
    - `manufacturers`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `website` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `product_manufacturers`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `manufacturer_id` (uuid, references manufacturers)
      - `is_default` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create manufacturers table
CREATE TABLE IF NOT EXISTS manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  website text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_manufacturers table
CREATE TABLE IF NOT EXISTS product_manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, manufacturer_id)
);

-- Enable RLS
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_manufacturers ENABLE ROW LEVEL SECURITY;

-- Create policies for manufacturers
CREATE POLICY "Allow authenticated read access" ON manufacturers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON manufacturers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON manufacturers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON manufacturers
  FOR DELETE TO authenticated USING (true);

-- Create policies for product_manufacturers
CREATE POLICY "Allow authenticated read access" ON product_manufacturers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON product_manufacturers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON product_manufacturers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON product_manufacturers
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger for manufacturers
CREATE TRIGGER update_manufacturers_updated_at
  BEFORE UPDATE ON manufacturers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();