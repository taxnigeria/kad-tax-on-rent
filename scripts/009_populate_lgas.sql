-- Populate LGAs with PayKaduna data using existing lga_id column

-- Clear existing data
TRUNCATE TABLE lgas CASCADE;

-- Populate LGAs with PayKaduna data (23 LGAs in Kaduna State)
INSERT INTO lgas (id, lga_id, name, state_id, created_at, updated_at) VALUES
(gen_random_uuid(), 1, 'Birnin Gwari', 19, NOW(), NOW()),
(gen_random_uuid(), 2, 'Chikun', 19, NOW(), NOW()),
(gen_random_uuid(), 3, 'Giwa', 19, NOW(), NOW()),
(gen_random_uuid(), 4, 'Igabi', 19, NOW(), NOW()),
(gen_random_uuid(), 5, 'Ikara', 19, NOW(), NOW()),
(gen_random_uuid(), 6, 'Jaba', 19, NOW(), NOW()),
(gen_random_uuid(), 7, 'Jema''a', 19, NOW(), NOW()),
(gen_random_uuid(), 8, 'Kachia', 19, NOW(), NOW()),
(gen_random_uuid(), 9, 'Kaduna North', 19, NOW(), NOW()),
(gen_random_uuid(), 10, 'Kaduna South', 19, NOW(), NOW()),
(gen_random_uuid(), 11, 'Kagarko', 19, NOW(), NOW()),
(gen_random_uuid(), 12, 'Kajuru', 19, NOW(), NOW()),
(gen_random_uuid(), 13, 'Kaura', 19, NOW(), NOW()),
(gen_random_uuid(), 14, 'Kauru', 19, NOW(), NOW()),
(gen_random_uuid(), 15, 'Kubau', 19, NOW(), NOW()),
(gen_random_uuid(), 16, 'Kudan', 19, NOW(), NOW()),
(gen_random_uuid(), 17, 'Lere', 19, NOW(), NOW()),
(gen_random_uuid(), 18, 'Makarfi', 19, NOW(), NOW()),
(gen_random_uuid(), 19, 'Sabon Gari', 19, NOW(), NOW()),
(gen_random_uuid(), 20, 'Sanga', 19, NOW(), NOW()),
(gen_random_uuid(), 21, 'Soba', 19, NOW(), NOW()),
(gen_random_uuid(), 22, 'Zangon Kataf', 19, NOW(), NOW()),
(gen_random_uuid(), 23, 'Zaria', 19, NOW(), NOW());

-- Create index on lga_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_lgas_lga_id ON lgas(lga_id);

COMMENT ON COLUMN lgas.lga_id IS 'PayKaduna API LGA ID';
