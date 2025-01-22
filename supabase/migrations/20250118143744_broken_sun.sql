/*
  # Enhance products with supplier relationships

  1. New Tables
    - product_suppliers
      - Links products to suppliers with supplier-specific details
      - Tracks supplier SKU and default status
  
  2. Changes
    - Add etilize_id to products table
*/

-- Add etilize_id to products if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'etilize_id'
  ) THEN
    ALTER TABLE products ADD COLUMN etilize_id text;
  END IF;
END $$;

-- Create product_suppliers table
CREATE TABLE IF NOT EXISTS product_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku text,
  is_default boolean DEFAULT false,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, supplier_id)
);

-- Enable RLS
ALTER TABLE product_suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for product_suppliers
CREATE POLICY "Allow authenticated read access" ON product_suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON product_suppliers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON product_suppliers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON product_suppliers
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_product_suppliers_updated_at
  BEFORE UPDATE ON product_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();