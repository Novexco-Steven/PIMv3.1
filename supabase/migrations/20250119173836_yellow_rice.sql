/*
  # Product Inventory Schema

  1. New Tables
    - servicing_areas
      - id (uuid, primary key)
      - country (text)
      - state_province (text, nullable)
      - postal_code (text, nullable)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - warehouses
      - id (uuid, primary key) 
      - name (text)
      - description (text)
      - address (text)
      - supplier_id (uuid, foreign key)
      - dropship_only (boolean)
      - status (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

    - warehouse_servicing_areas
      - id (uuid, primary key)
      - warehouse_id (uuid, foreign key)
      - servicing_area_id (uuid, foreign key)
      - created_at (timestamptz)

    - warehouse_codes
      - id (uuid, primary key)
      - warehouse_id (uuid, foreign key)
      - supplier_warehouse_code (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

    - inventory
      - id (uuid, primary key)
      - product_id (uuid, foreign key)
      - supplier_id (uuid, foreign key)
      - supplier_sku (text)
      - status (text)
      - availability_start_date (timestamptz)
      - availability_end_date (timestamptz)
      - supplier_warehouse_code (text)
      - quantity (integer)
      - next_availability_date (timestamptz)
      - last_sync_date (timestamptz)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create servicing_areas table
CREATE TABLE servicing_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  state_province text,
  postal_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create warehouses table
CREATE TABLE warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  address text NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT,
  dropship_only boolean DEFAULT false,
  status text NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create warehouse_servicing_areas table
CREATE TABLE warehouse_servicing_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE,
  servicing_area_id uuid REFERENCES servicing_areas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(warehouse_id, servicing_area_id)
);

-- Create warehouse_codes table
CREATE TABLE warehouse_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE,
  supplier_warehouse_code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(warehouse_id, supplier_warehouse_code)
);

-- Create inventory table
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT,
  supplier_sku text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'inactive')),
  availability_start_date timestamptz DEFAULT now(),
  availability_end_date timestamptz DEFAULT '9999-12-31',
  supplier_warehouse_code text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  next_availability_date timestamptz,
  last_sync_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_servicing_areas_country ON servicing_areas(country);
CREATE INDEX idx_servicing_areas_state_province ON servicing_areas(state_province);
CREATE INDEX idx_servicing_areas_postal_code ON servicing_areas(postal_code);
CREATE INDEX idx_warehouses_supplier_id ON warehouses(supplier_id);
CREATE INDEX idx_warehouses_status ON warehouses(status);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_supplier_id ON inventory(supplier_id);
CREATE INDEX idx_inventory_supplier_sku ON inventory(supplier_sku);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_warehouse_code ON inventory(supplier_warehouse_code);

-- Enable RLS
ALTER TABLE servicing_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_servicing_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON servicing_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON servicing_areas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON servicing_areas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON servicing_areas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON warehouses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON warehouses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON warehouses FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON warehouse_servicing_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON warehouse_servicing_areas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON warehouse_servicing_areas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON warehouse_servicing_areas FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON warehouse_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON warehouse_codes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON warehouse_codes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON warehouse_codes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON inventory FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON inventory FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON inventory FOR DELETE TO authenticated USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_servicing_areas_updated_at
  BEFORE UPDATE ON servicing_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_warehouse_codes_updated_at
  BEFORE UPDATE ON warehouse_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add computed column for inventory availability
ALTER TABLE inventory ADD COLUMN is_available boolean 
GENERATED ALWAYS AS (quantity > 0) STORED;