-- =====================================================
-- Migration: Add PayKaduna IDs to LGAs and Area Offices
-- =====================================================

-- Add PayKaduna LGA ID to lgas table
ALTER TABLE lgas
ADD COLUMN IF NOT EXISTS lga_id INTEGER UNIQUE;

CREATE INDEX IF NOT EXISTS idx_lgas_lga_id ON lgas(lga_id);

COMMENT ON COLUMN lgas.lga_id IS 'PayKaduna API LGA ID';

-- Add PayKaduna Tax Station ID to area_offices table
ALTER TABLE area_offices
ADD COLUMN IF NOT EXISTS tax_station_id INTEGER UNIQUE;

CREATE INDEX IF NOT EXISTS idx_area_offices_tax_station_id ON area_offices(tax_station_id);

COMMENT ON COLUMN area_offices.tax_station_id IS 'PayKaduna API Tax Station ID';
