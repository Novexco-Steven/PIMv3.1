/*
  # Add specifications schema

  1. New Tables
    - `specifications`
      - `id` (uuid, primary key)
      - `name` (text, required) - e.g., "General Information"
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `specification_items`
      - `id` (uuid, primary key)
      - `specification_id` (uuid, references specifications)
      - `name` (text, required) - e.g., "Manufacturer"
      - `value` (text, required)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `product_specifications`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `specification_id` (uuid, references specifications)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create specifications table
CREATE TABLE IF NOT EXISTS specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create specification_items table
CREATE TABLE IF NOT EXISTS specification_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specification_id uuid REFERENCES specifications(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_specifications table
CREATE TABLE IF NOT EXISTS product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  specification_id uuid REFERENCES specifications(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, specification_id)
);

-- Enable RLS
ALTER TABLE specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE specification_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

-- Create policies for specifications
CREATE POLICY "Allow authenticated read access" ON specifications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON specifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON specifications
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON specifications
  FOR DELETE TO authenticated USING (true);

-- Create policies for specification_items
CREATE POLICY "Allow authenticated read access" ON specification_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON specification_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON specification_items
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON specification_items
  FOR DELETE TO authenticated USING (true);

-- Create policies for product_specifications
CREATE POLICY "Allow authenticated read access" ON product_specifications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON product_specifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON product_specifications
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON product_specifications
  FOR DELETE TO authenticated USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_specifications_updated_at
  BEFORE UPDATE ON specifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_specification_items_updated_at
  BEFORE UPDATE ON specification_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();