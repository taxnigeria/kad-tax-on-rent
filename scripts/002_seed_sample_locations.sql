-- Seed sample Area Offices (if not already populated)
INSERT INTO area_offices (office_name, office_code, address, phone_number, email, is_active)
VALUES 
  ('KADIRS Central Office', 'KADIRS-CENTRAL', 'Central Business District, Kaduna', '+234-800-KADIRS-1', 'central@kadirs.gov.ng', true),
  ('KADIRS North Office', 'KADIRS-NORTH', 'Kaduna North LGA, Kaduna', '+234-800-KADIRS-2', 'north@kadirs.gov.ng', true),
  ('KADIRS South Office', 'KADIRS-SOUTH', 'Kaduna South LGA, Kaduna', '+234-800-KADIRS-3', 'south@kadirs.gov.ng', true)
ON CONFLICT (office_code) DO NOTHING;

-- Get the area office IDs for reference
DO $$
DECLARE
  central_office_id UUID;
  north_office_id UUID;
  south_office_id UUID;
BEGIN
  SELECT id INTO central_office_id FROM area_offices WHERE office_code = 'KADIRS-CENTRAL';
  SELECT id INTO north_office_id FROM area_offices WHERE office_code = 'KADIRS-NORTH';
  SELECT id INTO south_office_id FROM area_offices WHERE office_code = 'KADIRS-SOUTH';

  -- Seed sample LGAs
  INSERT INTO lgas (name, state, area_office_id)
  VALUES 
    ('Kaduna North', 'Kaduna', north_office_id),
    ('Kaduna South', 'Kaduna', south_office_id),
    ('Chikun', 'Kaduna', central_office_id),
    ('Zaria', 'Kaduna', north_office_id),
    ('Sabon Gari', 'Kaduna', central_office_id)
  ON CONFLICT DO NOTHING;

  -- Seed sample Cities
  INSERT INTO cities (name, lga_id, area_office_id, state)
  SELECT 
    'Kaduna City',
    (SELECT id FROM lgas WHERE name = 'Kaduna North' LIMIT 1),
    central_office_id,
    'Kaduna'
  WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Kaduna City');

  INSERT INTO cities (name, lga_id, area_office_id, state)
  SELECT 
    'Barnawa',
    (SELECT id FROM lgas WHERE name = 'Kaduna South' LIMIT 1),
    south_office_id,
    'Kaduna'
  WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Barnawa');

  INSERT INTO cities (name, lga_id, area_office_id, state)
  SELECT 
    'Zaria City',
    (SELECT id FROM lgas WHERE name = 'Zaria' LIMIT 1),
    north_office_id,
    'Kaduna'
  WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Zaria City');

  INSERT INTO cities (name, lga_id, area_office_id, state)
  SELECT 
    'Sabon Gari',
    (SELECT id FROM lgas WHERE name = 'Sabon Gari' LIMIT 1),
    central_office_id,
    'Kaduna'
  WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Sabon Gari');

  INSERT INTO cities (name, lga_id, area_office_id, state)
  SELECT 
    'Ungwan Rimi',
    (SELECT id FROM lgas WHERE name = 'Kaduna North' LIMIT 1),
    north_office_id,
    'Kaduna'
  WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = 'Ungwan Rimi');

END $$;
