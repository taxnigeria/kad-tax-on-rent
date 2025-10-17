-- =====================================================
-- Migration: Modify Industries Table for PayKaduna Integration
-- =====================================================

-- Drop existing industries table and recreate with correct structure
DROP TABLE IF EXISTS industries CASCADE;

-- Create industries table with UUID primary key and PayKaduna industry_id
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id INTEGER UNIQUE NOT NULL,  -- PayKaduna API ID
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_industries_industry_id ON industries(industry_id);
CREATE INDEX idx_industries_active ON industries(is_active);

-- Add updated_at trigger
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

-- Add comments
COMMENT ON TABLE industries IS 'Business industry sectors for KADIRS ID registration (PayKaduna integration)';
COMMENT ON COLUMN industries.industry_id IS 'PayKaduna API industry ID';

-- Re-add foreign key constraint to taxpayer_profiles
ALTER TABLE taxpayer_profiles
DROP COLUMN IF EXISTS industry_id;

ALTER TABLE taxpayer_profiles
ADD COLUMN industry_id UUID REFERENCES industries(id);

CREATE INDEX IF NOT EXISTS idx_taxpayer_profiles_industry ON taxpayer_profiles(industry_id);
