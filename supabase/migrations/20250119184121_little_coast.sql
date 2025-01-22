-- Create pricing tables
CREATE TABLE pricing_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'scheduled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE policy_inclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES pricing_policies(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (product_id IS NOT NULL AND category_id IS NULL) OR
    (product_id IS NULL AND category_id IS NOT NULL)
  )
);

CREATE TABLE policy_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES pricing_policies(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (product_id IS NOT NULL AND category_id IS NULL) OR
    (product_id IS NULL AND category_id IS NOT NULL)
  )
);

CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (
    type IN (
      'manufacturer', 'retail', 'liquidation', 'rebate', 'shipping',
      'percentage', 'amount', 'bogo', 'multi_buy', 'free_shipping', 'seasonal'
    )
  ),
  value numeric,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'scheduled')),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  is_stackable boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE promotion_inclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid REFERENCES promotions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (product_id IS NOT NULL AND category_id IS NULL) OR
    (product_id IS NULL AND category_id IS NOT NULL)
  )
);

CREATE TABLE promotion_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid REFERENCES promotions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (product_id IS NOT NULL AND category_id IS NULL) OR
    (product_id IS NULL AND category_id IS NOT NULL)
  )
);

CREATE TABLE pricing_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (
    type IN ('min_price_percentage', 'cost_plus_percentage', 'cost_plus_amount')
  ),
  value numeric NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add computed columns for best price
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS best_price numeric 
GENERATED ALWAYS AS (
  -- Complex price calculation logic will be implemented via functions
  0.00
) STORED;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS best_promotion_id uuid 
REFERENCES promotions(id) ON DELETE SET NULL;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS best_policy_id uuid 
REFERENCES pricing_policies(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE pricing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_inclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_inclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_calculations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON pricing_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON pricing_policies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON pricing_policies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON pricing_policies FOR DELETE TO authenticated USING (true);

-- Repeat for other tables...
CREATE POLICY "Allow authenticated read access" ON policy_inclusions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON policy_inclusions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON policy_inclusions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON policy_inclusions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON policy_exclusions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON policy_exclusions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON policy_exclusions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON policy_exclusions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON promotions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON promotions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON promotions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON promotions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON promotion_inclusions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON promotion_inclusions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON promotion_inclusions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON promotion_inclusions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON promotion_exclusions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON promotion_exclusions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON promotion_exclusions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON promotion_exclusions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON pricing_calculations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write access" ON pricing_calculations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access" ON pricing_calculations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access" ON pricing_calculations FOR DELETE TO authenticated USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_pricing_policies_updated_at
  BEFORE UPDATE ON pricing_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pricing_calculations_updated_at
  BEFORE UPDATE ON pricing_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes for better query performance
CREATE INDEX idx_pricing_policies_status ON pricing_policies(status);
CREATE INDEX idx_pricing_policies_dates ON pricing_policies(start_date, end_date);
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_type ON promotions(type);
CREATE INDEX idx_pricing_calculations_type ON pricing_calculations(type);