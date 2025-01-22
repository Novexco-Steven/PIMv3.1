/*
  # Enhance product manufacturers

  1. Changes
    - Add manufacturer_sku to product_manufacturers
    - Add status to product_manufacturers
    - Add etilize_id to product_manufacturers
*/

-- Add new columns to product_manufacturers
DO $$ 
BEGIN
  -- Add manufacturer_sku
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_manufacturers' AND column_name = 'manufacturer_sku'
  ) THEN
    ALTER TABLE product_manufacturers ADD COLUMN manufacturer_sku text;
  END IF;

  -- Add status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_manufacturers' AND column_name = 'status'
  ) THEN
    ALTER TABLE product_manufacturers ADD COLUMN status text DEFAULT 'active';
  END IF;

  -- Add etilize_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_manufacturers' AND column_name = 'etilize_id'
  ) THEN
    ALTER TABLE product_manufacturers ADD COLUMN etilize_id text;
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_manufacturers' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE product_manufacturers ADD COLUMN updated_at timestamptz DEFAULT now();
    
    -- Create trigger for updated_at
    CREATE TRIGGER update_product_manufacturers_updated_at
      BEFORE UPDATE ON product_manufacturers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;