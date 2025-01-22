-- Create catalog_category_metadata table
CREATE TABLE IF NOT EXISTS catalog_category_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES catalog_categories(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, key)
);

-- Create catalog_category_hierarchy table for tracking category paths
CREATE TABLE IF NOT EXISTS catalog_category_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ancestor_id uuid REFERENCES catalog_categories(id) ON DELETE CASCADE,
  descendant_id uuid REFERENCES catalog_categories(id) ON DELETE CASCADE,
  depth integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ancestor_id, descendant_id)
);

-- Enable RLS
ALTER TABLE catalog_category_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_category_hierarchy ENABLE ROW LEVEL SECURITY;

-- Create policies for catalog_category_metadata
CREATE POLICY "Allow authenticated read access" ON catalog_category_metadata
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON catalog_category_metadata
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON catalog_category_metadata
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON catalog_category_metadata
  FOR DELETE TO authenticated USING (true);

-- Create policies for catalog_category_hierarchy
CREATE POLICY "Allow authenticated read access" ON catalog_category_hierarchy
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON catalog_category_hierarchy
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON catalog_category_hierarchy
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON catalog_category_hierarchy
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger for catalog_category_metadata
CREATE TRIGGER update_catalog_category_metadata_updated_at
  BEFORE UPDATE ON catalog_category_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes for better query performance
CREATE INDEX idx_catalog_category_metadata_category_id ON catalog_category_metadata(category_id);
CREATE INDEX idx_catalog_category_hierarchy_ancestor ON catalog_category_hierarchy(ancestor_id);
CREATE INDEX idx_catalog_category_hierarchy_descendant ON catalog_category_hierarchy(descendant_id);
CREATE INDEX idx_catalog_category_hierarchy_depth ON catalog_category_hierarchy(depth);

-- Create function to maintain hierarchy
CREATE OR REPLACE FUNCTION maintain_catalog_category_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Insert self-reference
    INSERT INTO catalog_category_hierarchy (ancestor_id, descendant_id, depth)
    VALUES (NEW.id, NEW.id, 0);

    -- If parent exists, copy its hierarchy and add new paths
    IF NEW.parent_id IS NOT NULL THEN
      INSERT INTO catalog_category_hierarchy (ancestor_id, descendant_id, depth)
      SELECT h.ancestor_id, NEW.id, h.depth + 1
      FROM catalog_category_hierarchy h
      WHERE h.descendant_id = NEW.parent_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
    -- Remove old hierarchy paths
    DELETE FROM catalog_category_hierarchy
    WHERE descendant_id = NEW.id AND ancestor_id != NEW.id;

    -- Add new hierarchy paths if parent exists
    IF NEW.parent_id IS NOT NULL THEN
      INSERT INTO catalog_category_hierarchy (ancestor_id, descendant_id, depth)
      SELECT h.ancestor_id, NEW.id, h.depth + 1
      FROM catalog_category_hierarchy h
      WHERE h.descendant_id = NEW.parent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hierarchy maintenance
CREATE TRIGGER maintain_catalog_category_hierarchy_trigger
  AFTER INSERT OR UPDATE ON catalog_categories
  FOR EACH ROW
  EXECUTE FUNCTION maintain_catalog_category_hierarchy();

-- Add function to prevent circular references
CREATE OR REPLACE FUNCTION prevent_catalog_category_circular_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM catalog_category_hierarchy
      WHERE ancestor_id = NEW.id AND descendant_id = NEW.parent_id
    ) THEN
      RAISE EXCEPTION 'Circular reference detected in catalog category hierarchy';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent circular references
CREATE TRIGGER prevent_catalog_category_circular_reference_trigger
  BEFORE INSERT OR UPDATE ON catalog_categories
  FOR EACH ROW
  EXECUTE FUNCTION prevent_catalog_category_circular_reference();