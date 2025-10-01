-- Add new fields to properties table for business type and registration details
-- Version 1: Initial addition of business_type and registered_for_taxpayer_id

-- Add business_type field to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- Add registered_for_taxpayer_id to track if property is registered on behalf of someone else
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS registered_for_taxpayer_id UUID REFERENCES users(id);

-- Add comment to explain the fields
COMMENT ON COLUMN properties.business_type IS 'Type of business: sole_proprietor, franchise, partnership, company, cooperative, etc.';
COMMENT ON COLUMN properties.registered_for_taxpayer_id IS 'If property is registered on behalf of another taxpayer, this references their user ID';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_registered_for ON properties(registered_for_taxpayer_id);
