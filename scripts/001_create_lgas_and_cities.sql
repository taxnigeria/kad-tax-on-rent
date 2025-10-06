-- Create LGAs table
CREATE TABLE IF NOT EXISTS lgas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  state VARCHAR(100) NOT NULL,
  area_office_id UUID REFERENCES area_offices(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Cities table with relationships to LGAs and Area Offices
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  lga_id UUID NOT NULL REFERENCES lgas(id) ON DELETE CASCADE,
  area_office_id UUID NOT NULL REFERENCES area_offices(id),
  state VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add area_office_id to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS area_office_id UUID REFERENCES area_offices(id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lgas_state ON lgas(state);
CREATE INDEX IF NOT EXISTS idx_lgas_area_office ON lgas(area_office_id);
CREATE INDEX IF NOT EXISTS idx_cities_lga ON cities(lga_id);
CREATE INDEX IF NOT EXISTS idx_cities_area_office ON cities(area_office_id);
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state);
CREATE INDEX IF NOT EXISTS idx_properties_area_office ON properties(area_office_id);

-- Add updated_at trigger for lgas
CREATE OR REPLACE FUNCTION update_lgas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lgas_updated_at
  BEFORE UPDATE ON lgas
  FOR EACH ROW
  EXECUTE FUNCTION update_lgas_updated_at();

-- Add updated_at trigger for cities
CREATE OR REPLACE FUNCTION update_cities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_cities_updated_at();

-- Add comments for documentation
COMMENT ON TABLE lgas IS 'Local Government Areas with their associated area offices';
COMMENT ON TABLE cities IS 'Cities with their LGA and Area Office relationships';
COMMENT ON COLUMN properties.area_office_id IS 'The KADIRS branch/area office managing this property';
