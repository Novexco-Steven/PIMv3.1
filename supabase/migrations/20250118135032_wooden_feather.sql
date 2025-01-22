/*
  # Add suppliers and update manufacturers

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to Manufacturers
    - Add `manufacturer_id` (text) for external ID
    - Create `manufacturer_suppliers` junction table for many-to-many relationship

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create manufacturer_suppliers junction table
CREATE TABLE IF NOT EXISTS manufacturer_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(manufacturer_id, supplier_id)
);

-- Add manufacturer_id to manufacturers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'manufacturers' AND column_name = 'manufacturer_id'
  ) THEN
    ALTER TABLE manufacturers ADD COLUMN manufacturer_id text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers
CREATE POLICY "Allow authenticated read access" ON suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON suppliers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON suppliers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON suppliers
  FOR DELETE TO authenticated USING (true);

-- Create policies for manufacturer_suppliers
CREATE POLICY "Allow authenticated read access" ON manufacturer_suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON manufacturer_suppliers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON manufacturer_suppliers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON manufacturer_suppliers
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger for suppliers
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();