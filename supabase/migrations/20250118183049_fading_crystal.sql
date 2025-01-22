-- Create product_questions_answers table
CREATE TABLE IF NOT EXISTS product_questions_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_questions_answers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON product_questions_answers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON product_questions_answers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON product_questions_answers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete" ON product_questions_answers
  FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_product_questions_answers_updated_at
  BEFORE UPDATE ON product_questions_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();