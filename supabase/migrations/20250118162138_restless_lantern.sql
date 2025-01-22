/*
  # Fix product specifications table

  1. Changes
    - Add check for existing policies before creating them
    - Ensure table and RLS are properly set up
*/

-- Create product_specifications junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  specification_id uuid REFERENCES specifications(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, specification_id)
);

-- Enable RLS
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  -- Check and create SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_specifications' 
    AND policyname = 'Allow authenticated read access'
  ) THEN
    CREATE POLICY "Allow authenticated read access" ON product_specifications
      FOR SELECT TO authenticated USING (true);
  END IF;

  -- Check and create INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_specifications' 
    AND policyname = 'Allow authenticated insert'
  ) THEN
    CREATE POLICY "Allow authenticated insert" ON product_specifications
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  -- Check and create UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_specifications' 
    AND policyname = 'Allow authenticated update'
  ) THEN
    CREATE POLICY "Allow authenticated update" ON product_specifications
      FOR UPDATE TO authenticated USING (true);
  END IF;

  -- Check and create DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'product_specifications' 
    AND policyname = 'Allow authenticated delete'
  ) THEN
    CREATE POLICY "Allow authenticated delete" ON product_specifications
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Add updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_product_specifications_updated_at'
  ) THEN
    CREATE TRIGGER update_product_specifications_updated_at
      BEFORE UPDATE ON product_specifications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;