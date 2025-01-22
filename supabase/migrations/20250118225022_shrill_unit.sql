-- Create catalog_templates table
CREATE TABLE IF NOT EXISTS catalog_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  column_count integer NOT NULL DEFAULT 2,
  row_count integer NOT NULL DEFAULT 2,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create catalog_template_cells table
CREATE TABLE IF NOT EXISTS catalog_template_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES catalog_templates(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  column_index integer NOT NULL,
  row_span integer NOT NULL DEFAULT 1,
  column_span integer NOT NULL DEFAULT 1,
  height integer,
  width integer,
  content_type text NOT NULL CHECK (content_type IN ('Product', 'Custom')),
  custom_content text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(template_id, row_index, column_index)
);

-- Create catalog_sections table
CREATE TABLE IF NOT EXISTS catalog_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid REFERENCES catalogs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add section_id to catalog_pages
ALTER TABLE catalog_pages 
ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES catalog_sections(id) ON DELETE SET NULL;

-- Add template_id to catalog_pages
ALTER TABLE catalog_pages 
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES catalog_templates(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE catalog_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_template_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for catalog_templates
CREATE POLICY "Allow authenticated read access" ON catalog_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON catalog_templates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON catalog_templates
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON catalog_templates
  FOR DELETE TO authenticated USING (true);

-- Create policies for catalog_template_cells
CREATE POLICY "Allow authenticated read access" ON catalog_template_cells
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON catalog_template_cells
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON catalog_template_cells
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON catalog_template_cells
  FOR DELETE TO authenticated USING (true);

-- Create policies for catalog_sections
CREATE POLICY "Allow authenticated read access" ON catalog_sections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON catalog_sections
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON catalog_sections
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON catalog_sections
  FOR DELETE TO authenticated USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_catalog_templates_updated_at
  BEFORE UPDATE ON catalog_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_catalog_sections_updated_at
  BEFORE UPDATE ON catalog_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default templates
INSERT INTO catalog_templates (name, description, column_count, row_count, is_default)
VALUES 
  ('Single Product', 'Full-page single product layout', 1, 1, true),
  ('Two Products', 'Two products side by side', 2, 1, true),
  ('Grid 2x2', 'Four products in a grid layout', 2, 2, true),
  ('Grid 3x2', 'Six products in a grid layout', 3, 2, true)
ON CONFLICT DO NOTHING;