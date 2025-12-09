-- Migration: Fix LGA <-> Area Office Relationship
-- Before: lgas.area_office_id -> area_offices.id (LGA belongs to one Area Office) - INCORRECT
-- After: area_offices.lga_id -> lgas.id (Area Office belongs to one LGA) - CORRECT

-- Step 1: Add lga_id column to area_offices table
ALTER TABLE area_offices 
ADD COLUMN IF NOT EXISTS lga_id uuid REFERENCES lgas(id) ON DELETE SET NULL;

-- Step 2: Migrate existing relationships (reverse the FK direction)
-- For each LGA that has an area_office_id, update the corresponding area_office to point back to the LGA
UPDATE area_offices ao
SET lga_id = l.id
FROM lgas l
WHERE l.area_office_id = ao.id
  AND ao.lga_id IS NULL;

-- Step 3: Remove area_office_id from lgas table (no longer needed)
ALTER TABLE lgas 
DROP COLUMN IF EXISTS area_office_id;

-- Step 4: Remove area_office_id from cities table (can be derived from LGA's area offices)
ALTER TABLE cities 
DROP COLUMN IF EXISTS area_office_id;

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_area_offices_lga_id ON area_offices(lga_id);

-- Step 6: Add comment for documentation
COMMENT ON COLUMN area_offices.lga_id IS 'The LGA this area office belongs to. One LGA can have multiple area offices.';
