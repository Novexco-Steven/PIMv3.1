-- Add pricing columns to product_suppliers table
ALTER TABLE product_suppliers
ADD COLUMN IF NOT EXISTS cost numeric,
ADD COLUMN IF NOT EXISTS msrp numeric,
ADD COLUMN IF NOT EXISTS map numeric;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_suppliers_cost ON product_suppliers(cost);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_msrp ON product_suppliers(msrp);
CREATE INDEX IF NOT EXISTS idx_product_suppliers_map ON product_suppliers(map);