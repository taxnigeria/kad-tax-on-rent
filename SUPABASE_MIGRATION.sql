-- Add optional image columns to the properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_facade_image_url TEXT,
ADD COLUMN IF NOT EXISTS property_facade_image_name TEXT,
ADD COLUMN IF NOT EXISTS address_number_image_url TEXT,
ADD COLUMN IF NOT EXISTS address_number_image_name TEXT,
ADD COLUMN IF NOT EXISTS other_documents JSONB DEFAULT '[]'::jsonb;
