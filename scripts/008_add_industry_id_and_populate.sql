-- Add industry_id column to industries table and populate with PayKaduna data

-- Add industry_id column if it doesn't exist
ALTER TABLE industries ADD COLUMN IF NOT EXISTS industry_id INTEGER UNIQUE;

-- Clear existing data
TRUNCATE TABLE industries CASCADE;

-- Populate industries with PayKaduna data
INSERT INTO industries (id, industry_id, name, created_at, updated_at) VALUES
(gen_random_uuid(), 1, 'Agriculture', NOW(), NOW()),
(gen_random_uuid(), 2, 'Oil and Gas', NOW(), NOW()),
(gen_random_uuid(), 3, 'Banking and Finance', NOW(), NOW()),
(gen_random_uuid(), 4, 'Telecommunications', NOW(), NOW()),
(gen_random_uuid(), 5, 'Manufacturing', NOW(), NOW()),
(gen_random_uuid(), 6, 'Real Estate', NOW(), NOW()),
(gen_random_uuid(), 7, 'Construction', NOW(), NOW()),
(gen_random_uuid(), 8, 'Healthcare', NOW(), NOW()),
(gen_random_uuid(), 9, 'Information Technology (IT)', NOW(), NOW()),
(gen_random_uuid(), 10, 'Education', NOW(), NOW()),
(gen_random_uuid(), 11, 'Transportation and Logistics', NOW(), NOW()),
(gen_random_uuid(), 12, 'Hospitality and Tourism', NOW(), NOW()),
(gen_random_uuid(), 13, 'Retail and Wholesale', NOW(), NOW()),
(gen_random_uuid(), 14, 'Renewable Energy', NOW(), NOW()),
(gen_random_uuid(), 15, 'Mining and Quarrying', NOW(), NOW()),
(gen_random_uuid(), 16, 'Media and Entertainment', NOW(), NOW()),
(gen_random_uuid(), 17, 'Insurance', NOW(), NOW()),
(gen_random_uuid(), 18, 'Textile and Garment Industry', NOW(), NOW()),
(gen_random_uuid(), 19, 'Automobile Industry', NOW(), NOW());

-- Create index on industry_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_industries_industry_id ON industries(industry_id);

COMMENT ON COLUMN industries.industry_id IS 'PayKaduna API industry ID';
