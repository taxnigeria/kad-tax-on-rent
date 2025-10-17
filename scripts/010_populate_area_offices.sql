-- Populate area_offices (tax stations) with PayKaduna data using existing area_office_id column

-- Clear existing data
TRUNCATE TABLE area_offices CASCADE;

-- Populate area_offices with PayKaduna data (36 tax stations)
INSERT INTO area_offices (id, area_office_id, name, address, created_at, updated_at) VALUES
(gen_random_uuid(), 2, 'Kakuri East', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 3, 'Tudun Wada', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 4, 'Kakuri West', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 5, 'Kafanchan', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 6, 'Zaria', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 7, 'Kawo', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 8, 'Doka East', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 9, 'Doka West', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 10, 'Samaru', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 11, 'Zonkwa', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 12, 'Kachia', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 13, 'Jere', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 14, 'Birnin Gwari', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 15, 'Turunku', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 16, 'Giwa', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 17, 'Makarfi', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 18, 'Ikara', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 19, 'Soba', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 20, 'Saminaka', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 21, 'Kaura', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 22, 'Kauru', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 23, 'Kudan', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 24, 'Kajuru', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 25, 'Kubau', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 26, 'Gwantu', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 27, 'Rigasa Mini', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 28, 'Sabo Mini', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 29, 'Oriakata Mini', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 30, 'Sheikh Gumi Market', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 31, 'Kwoi', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 32, 'Sabon Gari', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 33, 'Abuja', 'Abuja', NOW(), NOW()),
(gen_random_uuid(), 34, 'CMR MLA', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 35, 'Obasanjo House MLA', 'Kaduna', NOW(), NOW()),
(gen_random_uuid(), 36, 'FRSC MLA', 'Kaduna', NOW(), NOW());

-- Create index on area_office_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_area_offices_area_office_id ON area_offices(area_office_id);

COMMENT ON COLUMN area_offices.area_office_id IS 'PayKaduna API tax station ID';
