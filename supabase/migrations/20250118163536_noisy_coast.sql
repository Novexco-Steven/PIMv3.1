/*
  # Update Specifications Structure

  1. Changes
    - Remove value from specification_items table
    - Add product_specification_values table for product-specific values

  2. New Tables
    - product_specification_values
      - id (uuid, primary key)
      - product_id (uuid, references products)
      - specification_id (uuid, references specifications)
      - item_id (uuid, references specification_items)
      - value (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  3. Security
    - Enable RLS on new table
    - Add policies for authenticated users
*/

-- Create product_specification_values table
CREATE TABLE IF NOT EXISTS product_specification_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  specification_id uuid REFERENCES specifications(id) ON DELETE CASCADE,
  item_id uuid REFERENCES specification_items(id) ON DELETE CASCADE,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, specification_id, item_id)
);

-- Enable RLS
ALTER TABLE product_specification_values ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON product_specification_values
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON product_specification_values
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON product_specification_values
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON product_specification_values
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_product_specification_values_updated_at
  BEFORE UPDATE ON product_specification_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Remove value column from specification_items if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'specification_items' AND column_name = 'value'
  ) THEN
    ALTER TABLE specification_items DROP COLUMN value;
  END IF;
END $$;