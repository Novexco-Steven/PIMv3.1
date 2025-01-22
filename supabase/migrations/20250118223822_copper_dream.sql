/*
  # Add catalog category ID to catalog pages

  1. Changes
    - Add catalog_category_id column to catalog_pages table
    - Add foreign key constraint to catalog_categories table
    - Add index for improved query performance

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Sets up foreign key with ON DELETE SET NULL for data integrity
    - Adds index to improve query performance when filtering by category
*/

-- Add catalog_category_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'catalog_pages' AND column_name = 'catalog_category_id'
  ) THEN
    ALTER TABLE catalog_pages 
    ADD COLUMN catalog_category_id uuid REFERENCES catalog_categories(id) ON DELETE SET NULL;

    -- Create index for the new column
    CREATE INDEX idx_catalog_pages_category_id ON catalog_pages(catalog_category_id);
  END IF;
END $$;