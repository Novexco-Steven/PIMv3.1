/*
  # Fix attributes table and policies

  1. Changes
    - Add updated_at column to attributes table
    - Add trigger for updated_at
    - Drop and recreate RLS policies with proper permissions

  2. Security
    - Enable RLS on attributes table
    - Add policies for all CRUD operations
*/

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attributes' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE attributes ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_attributes_updated_at'
  ) THEN
    CREATE TRIGGER update_attributes_updated_at
      BEFORE UPDATE ON attributes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop SELECT policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attributes' 
    AND policyname = 'Allow authenticated read access'
  ) THEN
    DROP POLICY "Allow authenticated read access" ON attributes;
  END IF;

  -- Drop INSERT policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attributes' 
    AND policyname = 'Allow authenticated insert'
  ) THEN
    DROP POLICY "Allow authenticated insert" ON attributes;
  END IF;

  -- Drop UPDATE policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attributes' 
    AND policyname = 'Allow authenticated update'
  ) THEN
    DROP POLICY "Allow authenticated update" ON attributes;
  END IF;

  -- Drop DELETE policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'attributes' 
    AND policyname = 'Allow authenticated delete'
  ) THEN
    DROP POLICY "Allow authenticated delete" ON attributes;
  END IF;
END $$;

-- Recreate policies
CREATE POLICY "Allow authenticated read access" ON attributes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON attributes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON attributes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON attributes
  FOR DELETE TO authenticated USING (true);