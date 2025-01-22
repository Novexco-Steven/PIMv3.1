-- Drop existing unique constraint
ALTER TABLE product_relations 
DROP CONSTRAINT IF EXISTS product_relations_product_id_related_product_id_key;

-- Add new unique constraint including type
ALTER TABLE product_relations 
ADD CONSTRAINT product_relations_product_id_related_product_id_type_key 
UNIQUE (product_id, related_product_id, type);