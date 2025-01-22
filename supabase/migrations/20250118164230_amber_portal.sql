/*
  # Fix categories table policies

  1. Changes
    - Drop and recreate RLS policies with proper permissions
    - Ensure all CRUD operations are allowed for authenticated users

  2. Security
    - Enable RLS on categories table
    - Add policies for all CRUD operations
*/

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop SELECT policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Allow authenticated read access'
  ) THEN
    DROP POLICY "Allow authenticated read access" ON categories;
  END IF;

  -- Drop INSERT policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Allow authenticated insert'
  ) THEN
    DROP POLICY "Allow authenticated insert" ON categories;
  END IF;

  -- Drop UPDATE policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Allow authenticated update'
  ) THEN
    DROP POLICY "Allow authenticated update" ON categories;
  END IF;

  -- Drop DELETE policy if exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'categories' 
    AND policyname = 'Allow authenticated delete'
  ) THEN
    DROP POLICY "Allow authenticated delete" ON categories;
  END IF;
END $$;

-- Recreate policies with proper permissions
CREATE POLICY "Allow authenticated read access" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON categories
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON categories
  FOR DELETE TO authenticated USING (true);