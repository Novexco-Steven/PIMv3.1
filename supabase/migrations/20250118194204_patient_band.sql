/*
  # Catalog System Schema

  1. New Tables
    - `catalogs`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `catalog_pages`
      - `id` (uuid, primary key)
      - `catalog_id` (uuid, foreign key)
      - `page_number` (integer)
      - `column_count` (integer)
      - `row_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `catalog_cells`
      - `id` (uuid, primary key)
      - `page_id` (uuid, foreign key)
      - `row_index` (integer)
      - `column_index` (integer)
      - `row_span` (integer)
      - `column_span` (integer)
      - `height` (integer)
      - `width` (integer)
      - `content_type` (text)
      - `product_id` (uuid, foreign key, nullable)
      - `custom_content` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `catalog_index`
      - `id` (uuid, primary key)
      - `catalog_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `page_number` (integer)
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Triggers
    - Add updated_at triggers for all tables
*/

-- Create catalogs table
CREATE TABLE catalogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create catalog_pages table
CREATE TABLE catalog_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid REFERENCES catalogs(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  column_count integer NOT NULL DEFAULT 2,
  row_count integer NOT NULL DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(catalog_id, page_number)
);

-- Create catalog_cells table
CREATE TABLE catalog_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES catalog_pages(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  column_index integer NOT NULL,
  row_span integer NOT NULL DEFAULT 1,
  column_span integer NOT NULL DEFAULT 1,
  height integer,
  width integer,
  content_type text NOT NULL CHECK (content_type IN ('Product', 'Custom')),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  custom_content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(page_id, row_index, column_index)
);

-- Create catalog_index table
CREATE TABLE catalog_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid REFERENCES catalogs(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(catalog_id, product_id, page_number)
);

-- Enable Row Level Security
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_index ENABLE ROW LEVEL SECURITY;

-- Create policies for catalogs
CREATE POLICY "Allow authenticated read access" ON catalogs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON catalogs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON catalogs
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON catalogs
  FOR DELETE TO authenticated USING (true);

-- Create policies for catalog_pages
CREATE POLICY "Allow authenticated read access" ON catalog_pages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON catalog_pages
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON catalog_pages
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON catalog_pages
  FOR DELETE TO authenticated USING (true);

-- Create policies for catalog_cells
CREATE POLICY "Allow authenticated read access" ON catalog_cells
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON catalog_cells
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON catalog_cells
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON catalog_cells
  FOR DELETE TO authenticated USING (true);

-- Create policies for catalog_index
CREATE POLICY "Allow authenticated read access" ON catalog_index
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON catalog_index
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON catalog_index
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON catalog_index
  FOR DELETE TO authenticated USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_catalogs_updated_at
  BEFORE UPDATE ON catalogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_catalog_pages_updated_at
  BEFORE UPDATE ON catalog_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_catalog_cells_updated_at
  BEFORE UPDATE ON catalog_cells
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();