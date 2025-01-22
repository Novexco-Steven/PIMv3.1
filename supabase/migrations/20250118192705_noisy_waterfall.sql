/*
  # Add Product Descriptions

  1. New Tables
    - `product_descriptions`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `type` (text, enum: Raw, Main, Sub, Rich, About)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `product_descriptions` table
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create product_descriptions table
CREATE TABLE IF NOT EXISTS product_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('Raw', 'Main', 'Sub', 'Rich', 'About')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON product_descriptions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON product_descriptions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON product_descriptions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON product_descriptions
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_product_descriptions_updated_at
  BEFORE UPDATE ON product_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();