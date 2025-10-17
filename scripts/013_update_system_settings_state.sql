-- =====================================================
-- Population Script: Update System Settings with Kaduna State ID
-- =====================================================

-- Update system_settings with Kaduna state ID (19 from PayKaduna API)
UPDATE system_settings
SET state_id = 19
WHERE state_id IS NULL OR state_id != 19;

-- If no system_settings record exists, create one
INSERT INTO system_settings (state_id)
SELECT 19
WHERE NOT EXISTS (SELECT 1 FROM system_settings LIMIT 1);
