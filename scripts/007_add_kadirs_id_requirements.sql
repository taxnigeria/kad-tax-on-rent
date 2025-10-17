-- =====================================================
-- Migration: Add KADIRS ID Generation Requirements
-- =====================================================

-- Create industries table for KADIRS ID API
CREATE TABLE IF NOT EXISTS industries (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add state_id to system_settings for KADIRS API
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS state_id INTEGER;

-- Add comment
COMMENT ON COLUMN system_settings.state_id IS 'State ID for KADIRS API integration';

-- Create index for industries
CREATE INDEX IF NOT EXISTS idx_industries_active ON industries(is_active);

-- Add updated_at trigger for industries
CREATE OR REPLACE FUNCTION update_industries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_industries_updated_at
  BEFORE UPDATE ON industries
  FOR EACH ROW
  EXECUTE FUNCTION update_industries_updated_at();

-- Insert default industries (common Nigerian business sectors)
INSERT INTO industries (id, name, description) VALUES
  (1, 'Agriculture', 'Farming, livestock, and agricultural services'),
  (2, 'Manufacturing', 'Production and manufacturing industries'),
  (3, 'Construction', 'Building and construction services'),
  (4, 'Retail & Wholesale', 'Retail and wholesale trade'),
  (5, 'Hospitality & Tourism', 'Hotels, restaurants, and tourism'),
  (6, 'Real Estate', 'Property development and real estate services'),
  (7, 'Transportation', 'Transportation and logistics services'),
  (8, 'Financial Services', 'Banking, insurance, and financial services'),
  (9, 'Technology & IT', 'Information technology and software services'),
  (10, 'Healthcare', 'Medical and healthcare services'),
  (11, 'Education', 'Educational institutions and services'),
  (12, 'Professional Services', 'Legal, accounting, consulting services'),
  (13, 'Entertainment & Media', 'Media, entertainment, and creative industries'),
  (14, 'Energy & Utilities', 'Power, water, and utility services'),
  (15, 'Telecommunications', 'Telecom and communication services'),
  (16, 'Other', 'Other business sectors')
ON CONFLICT (id) DO NOTHING;

-- Add KADIRS ID fields to taxpayer_profiles if not exists
ALTER TABLE taxpayer_profiles
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS lga_id UUID REFERENCES lgas(id),
ADD COLUMN IF NOT EXISTS industry_id INTEGER REFERENCES industries(id),
ADD COLUMN IF NOT EXISTS tin VARCHAR(50),
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'Individual' CHECK (user_type IN ('Individual', 'Corporate'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_taxpayer_profiles_lga ON taxpayer_profiles(lga_id);
CREATE INDEX IF NOT EXISTS idx_taxpayer_profiles_industry ON taxpayer_profiles(industry_id);

-- Add comments
COMMENT ON TABLE industries IS 'Business industry sectors for KADIRS ID registration';
COMMENT ON COLUMN taxpayer_profiles.address_line1 IS 'Primary address for KADIRS ID registration';
COMMENT ON COLUMN taxpayer_profiles.lga_id IS 'Local Government Area for KADIRS ID registration';
COMMENT ON COLUMN taxpayer_profiles.industry_id IS 'Business industry sector for KADIRS ID registration';
COMMENT ON COLUMN taxpayer_profiles.user_type IS 'Individual or Corporate taxpayer type';
