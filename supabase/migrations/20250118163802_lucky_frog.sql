/*
  # Update Attributes Structure

  1. Changes
    - Add product_attribute_values table for product-specific values
    - Add options column to attributes for select/multiselect types

  2. New Tables
    - product_attribute_values
      - id (uuid, primary key)
      - product_id (uuid, references products)
      - attribute_id (uuid, references attributes)
      - value (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  3. Security
    - Enable RLS on new table
    - Add policies for authenticated users
*/

-- Add options column to attributes if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attributes' AND column_name = 'options'
  ) THEN
    ALTER TABLE attributes ADD COLUMN options text[];
  END IF;
END $$;

-- Create product_attribute_values table
CREATE TABLE IF NOT EXISTS product_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  attribute_id uuid REFERENCES attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, attribute_id)
);

-- Enable RLS
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON product_attribute_values
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON product_attribute_values
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON product_attribute_values
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON product_attribute_values
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_product_attribute_values_updated_at
  BEFORE UPDATE ON product_attribute_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();