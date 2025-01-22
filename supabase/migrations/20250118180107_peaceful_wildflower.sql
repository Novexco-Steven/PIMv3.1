/*
  # Add Product Relations

  1. New Tables
    - `product_relations`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `related_product_id` (uuid, references products)
      - `type` (text) - similar, variant, suggested
      - `order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `product_relations` table
    - Add policies for authenticated users
*/

-- Create product_relations table
CREATE TABLE IF NOT EXISTS product_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  related_product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('similar', 'variant', 'suggested')),
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, related_product_id)
);

-- Enable RLS
ALTER TABLE product_relations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON product_relations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON product_relations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON product_relations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON product_relations
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_product_relations_updated_at
  BEFORE UPDATE ON product_relations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();