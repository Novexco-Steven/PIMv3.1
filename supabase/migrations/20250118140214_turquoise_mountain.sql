/*
  # Add image fields to assets table

  1. Changes
    - Add usage_type column to assets table
    - Add alt_tag column to assets table
    - Add is_default column to assets table

  2. Security
    - No changes to RLS policies (using existing ones)
*/

DO $$ 
BEGIN
  -- Add usage_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'usage_type'
  ) THEN
    ALTER TABLE assets ADD COLUMN usage_type text;
  END IF;

  -- Add alt_tag column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'alt_tag'
  ) THEN
    ALTER TABLE assets ADD COLUMN alt_tag text;
  END IF;

  -- Add is_default column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE assets ADD COLUMN is_default boolean DEFAULT false;
  END IF;
END $$;