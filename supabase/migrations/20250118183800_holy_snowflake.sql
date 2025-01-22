-- Create product_seo table
CREATE TABLE IF NOT EXISTS product_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  keywords text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE product_seo ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON product_seo
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON product_seo
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON product_seo
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON product_seo
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_product_seo_updated_at
  BEFORE UPDATE ON product_seo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();