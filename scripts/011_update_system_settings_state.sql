-- Update system_settings with Kaduna state information

-- Add state_id column if it doesn't exist
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS state_id INTEGER DEFAULT 19;

-- Update existing record with state_id
UPDATE system_settings SET state_id = 19 WHERE state_id IS NULL;

COMMENT ON COLUMN system_settings.state_id IS 'PayKaduna API state ID (19 = Kaduna)';
