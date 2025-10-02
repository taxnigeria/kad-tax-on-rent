-- Create system_settings table for configurable application settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- 'general', 'ai_features', 'regional', 'branding'
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  UNIQUE(category, setting_key)
);

-- Create index for faster lookups
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_active ON system_settings(is_active);

-- Insert default settings
INSERT INTO system_settings (category, setting_key, setting_value, description) VALUES
  -- General Settings
  ('general', 'app_name', '"Tax Portal"', 'Application name displayed throughout the system'),
  ('general', 'app_logo_url', 'null', 'URL to the application logo'),
  ('general', 'support_email', '"support@taxportal.com"', 'Support contact email'),
  ('general', 'support_phone', '"+234-XXX-XXX-XXXX"', 'Support contact phone number'),
  
  -- AI Features
  ('ai_features', 'ai_assistant_enabled', 'true', 'Enable/disable AI assistant feature'),
  ('ai_features', 'ai_document_analysis', 'true', 'Enable/disable AI document analysis'),
  ('ai_features', 'ai_tax_recommendations', 'false', 'Enable/disable AI tax recommendations'),
  
  -- Regional Settings
  ('regional', 'default_state', '"Kaduna"', 'Default state for the application'),
  ('regional', 'currency', '"NGN"', 'Currency code (NGN, USD, etc.)'),
  ('regional', 'currency_symbol', '"₦"', 'Currency symbol'),
  ('regional', 'date_format', '"DD/MM/YYYY"', 'Date format preference'),
  ('regional', 'timezone', '"Africa/Lagos"', 'Application timezone'),
  
  -- Branding
  ('branding', 'primary_color', '"#16a34a"', 'Primary brand color'),
  ('branding', 'secondary_color', '"#0ea5e9"', 'Secondary brand color'),
  ('branding', 'favicon_url', 'null', 'URL to the favicon')
ON CONFLICT (category, setting_key) DO NOTHING;

-- Create audit trigger for settings changes
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_timestamp();

COMMENT ON TABLE system_settings IS 'Stores configurable application settings that can be updated without code deployment';
