-- Migration: Add area_office_id to cities table
-- This creates a one-to-one relationship: City belongs to one Area Office

-- Step 1: Add area_office_id column to cities
ALTER TABLE cities 
ADD COLUMN IF NOT EXISTS area_office_id uuid REFERENCES area_offices(id);

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_cities_area_office_id ON cities(area_office_id);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN cities.area_office_id IS 'The area office this city belongs to. An area office can have many cities.';
