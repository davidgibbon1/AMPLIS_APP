-- Update existing deliverables with default colors (vibrant, distinct colors)
-- This creates a nice visual separation between deliverables
WITH deliverable_colors AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "Deliverable"
)
UPDATE "Deliverable" d
SET "colour" = CASE (dc.rn - 1) % 10
  WHEN 0 THEN '#3B82F6'  -- Blue
  WHEN 1 THEN '#10B981'  -- Green
  WHEN 2 THEN '#F59E0B'  -- Amber
  WHEN 3 THEN '#EF4444'  -- Red
  WHEN 4 THEN '#8B5CF6'  -- Purple
  WHEN 5 THEN '#EC4899'  -- Pink
  WHEN 6 THEN '#06B6D4'  -- Cyan
  WHEN 7 THEN '#F97316'  -- Orange
  WHEN 8 THEN '#6366F1'  -- Indigo
  ELSE '#14B8A6'         -- Teal
END,
"sortOrder" = dc.rn - 1
FROM deliverable_colors dc
WHERE d.id = dc.id
  AND d.colour IS NULL;  -- Only update deliverables without colors
