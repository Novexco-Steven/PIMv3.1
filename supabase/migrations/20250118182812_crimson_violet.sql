/*
  # Add Features and Benefits Table

  1. New Tables
    - `product_features_benefits`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `type` (text, either 'Feature' or 'Benefit')
      - `value` (text)
      - `order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `product_features_benefits` table
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create product_features_benefits table
CREATE TABLE IF NOT EXISTS product_features_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('Feature', 'Benefit')),
  value text NOT NULL,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_features_benefits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON product_features_benefits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON product_features_benefits
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON product_features_benefits
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON product_features_benefits
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_product_features_benefits_updated_at
  BEFORE UPDATE ON product_features_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();