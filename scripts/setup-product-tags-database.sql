-- ============================================================================
-- Supabase Database Setup for Product Tags System
-- ============================================================================
-- This SQL script creates the necessary table and functions for the intelligent
-- product selection system. It supports 4-dimensional tagging:
--   1. Product Type (e.g., serum, moisturizer, toner)
--   2. Benefit/Concern (e.g., hydrating, acne-treatment, brightening)
--   3. Skin Type (e.g., oily, dry, sensitive)
--   4. Price Range (e.g., affordable, mid-range, luxury)
-- 
-- Run this script in your Supabase SQL Editor before using the auto-tag script.
-- ============================================================================

-- Drop existing table if you want to start fresh (CAREFUL: this deletes all data!)
-- DROP TABLE IF EXISTS product_tags CASCADE;

-- ============================================================================
-- 1. Create the product_tags table
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_path TEXT NOT NULL UNIQUE,
  image_name TEXT NOT NULL,
  folder TEXT NOT NULL,
  product_name TEXT,  -- Will be identified by AI (optional, for future use)
  brand TEXT,         -- Will be identified by AI (optional, for future use)
  tags TEXT[] NOT NULL,  -- Array of exactly 4 tags: [type, benefit, skin_type, price]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a comment to document the table
COMMENT ON TABLE product_tags IS 'Stores product images with 4-dimensional tags for intelligent product selection';
COMMENT ON COLUMN product_tags.tags IS 'Array of 4 tags: [product_type, benefit, skin_type, price_range]';

-- ============================================================================
-- 2. Create indexes for fast querying
-- ============================================================================

-- Index on folder for filtering by storage folder
CREATE INDEX IF NOT EXISTS idx_product_tags_folder ON product_tags(folder);

-- GIN index on tags array for fast tag matching
CREATE INDEX IF NOT EXISTS idx_product_tags_tags ON product_tags USING GIN(tags);

-- Index on image_path for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_tags_image_path ON product_tags(image_path);

-- ============================================================================
-- 3. Create function to search products by tags with flexible matching
-- ============================================================================

-- Drop function if it exists (to allow updates)
DROP FUNCTION IF EXISTS search_products_by_tags(JSONB, INTEGER);

CREATE OR REPLACE FUNCTION search_products_by_tags(
  search_criteria JSONB,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  image_path TEXT,
  image_name TEXT,
  tags TEXT[],
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.image_path,
    pt.image_name,
    pt.tags,
    (
      -- Score based on how many criteria match (0-4)
      CASE WHEN search_criteria->>'productType' IS NOT NULL AND pt.tags @> ARRAY[search_criteria->>'productType'] THEN 1 ELSE 0 END +
      CASE WHEN search_criteria->>'benefit' IS NOT NULL AND pt.tags @> ARRAY[search_criteria->>'benefit'] THEN 1 ELSE 0 END +
      CASE WHEN search_criteria->>'skinType' IS NOT NULL AND pt.tags @> ARRAY[search_criteria->>'skinType'] THEN 1 ELSE 0 END +
      CASE WHEN search_criteria->>'priceRange' IS NOT NULL AND pt.tags @> ARRAY[search_criteria->>'priceRange'] THEN 1 ELSE 0 END
    ) AS match_score
  FROM product_tags pt
  WHERE 
    -- Must match at least one criterion (OR logic)
    (
      (search_criteria->>'productType' IS NULL OR pt.tags @> ARRAY[search_criteria->>'productType']) OR
      (search_criteria->>'benefit' IS NULL OR pt.tags @> ARRAY[search_criteria->>'benefit']) OR
      (search_criteria->>'skinType' IS NULL OR pt.tags @> ARRAY[search_criteria->>'skinType']) OR
      (search_criteria->>'priceRange' IS NULL OR pt.tags @> ARRAY[search_criteria->>'priceRange'])
    )
  ORDER BY match_score DESC, RANDOM()  -- Highest score first, then random for variety
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to document the function
COMMENT ON FUNCTION search_products_by_tags IS 'Searches products by flexible tag matching. Returns products ordered by match score (0-4).';

-- ============================================================================
-- 4. Example queries (for testing)
-- ============================================================================

-- Test 1: Search for affordable moisturizers for dry skin
-- SELECT * FROM search_products_by_tags(
--   '{"productType": "moisturizer", "skinType": "dry", "priceRange": "affordable"}'::jsonb,
--   10
-- );

-- Test 2: Search for any acne treatment products
-- SELECT * FROM search_products_by_tags(
--   '{"benefit": "acne-treatment"}'::jsonb,
--   10
-- );

-- Test 3: Search for sensitive skin products (any type)
-- SELECT * FROM search_products_by_tags(
--   '{"skinType": "sensitive"}'::jsonb,
--   10
-- );

-- Test 4: Get all products (no criteria)
-- SELECT * FROM product_tags LIMIT 10;

-- ============================================================================
-- 5. Helper function to get available tags (for debugging)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_tags()
RETURNS TABLE (
  tag TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    UNNEST(tags) AS tag,
    COUNT(*) AS count
  FROM product_tags
  GROUP BY tag
  ORDER BY count DESC, tag;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_available_tags IS 'Returns all unique tags used in the database with their frequency';

-- Test: Get all available tags with counts
-- SELECT * FROM get_available_tags();

-- ============================================================================
-- 6. Create function to get tag statistics by dimension
-- ============================================================================

CREATE OR REPLACE FUNCTION get_tag_statistics()
RETURNS TABLE (
  dimension TEXT,
  tag TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Product Type' AS dimension,
    tags[1] AS tag,
    COUNT(*) AS count
  FROM product_tags
  GROUP BY tags[1]
  
  UNION ALL
  
  SELECT 
    'Benefit' AS dimension,
    tags[2] AS tag,
    COUNT(*) AS count
  FROM product_tags
  GROUP BY tags[2]
  
  UNION ALL
  
  SELECT 
    'Skin Type' AS dimension,
    tags[3] AS tag,
    COUNT(*) AS count
  FROM product_tags
  GROUP BY tags[3]
  
  UNION ALL
  
  SELECT 
    'Price Range' AS dimension,
    tags[4] AS tag,
    COUNT(*) AS count
  FROM product_tags
  GROUP BY tags[4]
  
  ORDER BY dimension, count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_tag_statistics IS 'Returns tag statistics broken down by dimension (type, benefit, skin type, price)';

-- Test: Get tag statistics by dimension
-- SELECT * FROM get_tag_statistics();

-- ============================================================================
-- Setup Complete!
-- ============================================================================
-- Next steps:
-- 1. Run: node scripts/auto-tag-products.mjs
-- 2. Test the API: POST /api/get-product-images with { "topic": "your topic" }
-- 3. Check tag statistics: SELECT * FROM get_tag_statistics();
-- ============================================================================


