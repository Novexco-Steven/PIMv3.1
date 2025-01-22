-- Create catalog_categories table
CREATE TABLE IF NOT EXISTS catalog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES catalog_categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add catalog_category_id to catalog_pages
ALTER TABLE catalog_pages 
ADD COLUMN IF NOT EXISTS catalog_category_id uuid REFERENCES catalog_categories(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for catalog_categories
CREATE POLICY "Allow authenticated read access" ON catalog_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON catalog_categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON catalog_categories
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON catalog_categories
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_catalog_categories_updated_at
  BEFORE UPDATE ON catalog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();