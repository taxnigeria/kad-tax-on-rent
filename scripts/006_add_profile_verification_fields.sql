-- =====================================================
-- PROFILE COMPLETION & VERIFICATION FEATURES
-- Migration Script
-- =====================================================

-- Add verification fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add verification fields to taxpayer_profiles
ALTER TABLE taxpayer_profiles ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE taxpayer_profiles ADD COLUMN IF NOT EXISTS last_completion_check TIMESTAMP;

-- Create verification_tokens table for OTP tracking
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Token Details
  token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('phone_otp', 'email_verification')),
  token_value VARCHAR(10) NOT NULL,
  
  -- Delivery
  delivery_method VARCHAR(20) CHECK (delivery_method IN ('whatsapp', 'sms', 'email')),
  sent_to VARCHAR(255) NOT NULL,
  
  -- Status
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  -- Attempts
  verification_attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_tokens_user ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_type ON verification_tokens(token_type);
CREATE INDEX idx_verification_tokens_expires ON verification_tokens(expires_at);

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_completion INTEGER := 0;
  v_user_role VARCHAR(20);
  v_email_verified BOOLEAN;
  v_phone_verified BOOLEAN;
  v_profile_photo_url TEXT;
  v_kadirs_id VARCHAR(50);
  v_tax_id VARCHAR(50);
  v_property_count INTEGER;
  v_rental_count INTEGER;
BEGIN
  -- Get user details
  SELECT role, email_verified, phone_verified, profile_photo_url
  INTO v_user_role, v_email_verified, v_phone_verified, v_profile_photo_url
  FROM users
  WHERE id = p_user_id;
  
  -- Get taxpayer profile details
  SELECT kadirs_id, tax_id_or_nin
  INTO v_kadirs_id, v_tax_id
  FROM taxpayer_profiles
  WHERE user_id = p_user_id;
  
  -- Base completion items (apply to all roles)
  IF v_email_verified THEN v_completion := v_completion + 20; END IF;
  IF v_phone_verified THEN v_completion := v_completion + 20; END IF;
  IF v_kadirs_id IS NOT NULL THEN v_completion := v_completion + 20; END IF;
  IF v_profile_photo_url IS NOT NULL THEN v_completion := v_completion + 10; END IF;
  
  -- Role-specific completion items
  IF v_user_role IN ('taxpayer', 'property_manager') THEN
    -- Check if at least one property is registered
    SELECT COUNT(*) INTO v_property_count
    FROM properties
    WHERE owner_id = p_user_id;
    
    IF v_property_count > 0 THEN v_completion := v_completion + 30; END IF;
    
  ELSIF v_user_role = 'tenant' THEN
    -- Check if at least one rental is linked
    SELECT COUNT(*) INTO v_rental_count
    FROM tenant_rentals
    WHERE tenant_id = p_user_id AND is_active = true;
    
    IF v_rental_count > 0 THEN v_completion := v_completion + 30; END IF;
  END IF;
  
  RETURN v_completion;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_completion INTEGER;
BEGIN
  -- Determine user_id based on the table
  IF TG_TABLE_NAME = 'users' THEN
    v_user_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'taxpayer_profiles' THEN
    v_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'properties' THEN
    v_user_id := NEW.owner_id;
  ELSIF TG_TABLE_NAME = 'tenant_rentals' THEN
    v_user_id := NEW.tenant_id;
  END IF;
  
  -- Calculate and update completion percentage
  v_completion := calculate_profile_completion(v_user_id);
  
  UPDATE taxpayer_profiles
  SET 
    profile_completion_percentage = v_completion,
    last_completion_check = NOW()
  WHERE user_id = v_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update profile completion
DROP TRIGGER IF EXISTS update_completion_on_user_change ON users;
CREATE TRIGGER update_completion_on_user_change
  AFTER UPDATE OF email_verified, phone_verified, profile_photo_url ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS update_completion_on_profile_change ON taxpayer_profiles;
CREATE TRIGGER update_completion_on_profile_change
  AFTER UPDATE OF kadirs_id ON taxpayer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS update_completion_on_property_add ON properties;
CREATE TRIGGER update_completion_on_property_add
  AFTER INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

DROP TRIGGER IF EXISTS update_completion_on_rental_add ON tenant_rentals;
CREATE TRIGGER update_completion_on_rental_add
  AFTER INSERT ON tenant_rentals
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

-- RLS Policies for verification_tokens
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY verification_tokens_select_own ON verification_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY verification_tokens_insert_own ON verification_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add system settings for verification services
INSERT INTO system_settings (setting_key, category, setting_value, description)
VALUES 
  ('n8n_whatsapp_webhook_url', 'verification', '{"url": ""}', 'N8N Webhook URL for WhatsApp OTP'),
  ('kadirs_id_api_url', 'verification', '{"url": ""}', 'API URL for KADIRS ID generation'),
  ('kadirs_id_api_key', 'verification', '{"key": ""}', 'API Key for KADIRS ID service')
ON CONFLICT (setting_key) DO NOTHING;

-- Initialize profile completion for existing users
DO $$
DECLARE
  user_record RECORD;
  completion_pct INTEGER;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    completion_pct := calculate_profile_completion(user_record.id);
    
    UPDATE taxpayer_profiles
    SET 
      profile_completion_percentage = completion_pct,
      last_completion_check = NOW()
    WHERE user_id = user_record.id;
  END LOOP;
END $$;
