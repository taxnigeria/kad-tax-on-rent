-- =====================================================
-- PROFILE COMPLETION FEATURE
-- Add fields for email/phone verification, KADIRS ID, profile photo
-- =====================================================

-- Add verification and profile fields to taxpayer_profiles
ALTER TABLE taxpayer_profiles 
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_completion_dismissed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_profile_check TIMESTAMP;

-- Add email_verified to users table (if not exists)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Create verification_tokens table for OTP/email verification
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Token Details
  token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('email', 'phone', 'whatsapp')),
  token_value VARCHAR(10) NOT NULL,
  
  -- Contact Info
  email VARCHAR(255),
  phone_number VARCHAR(20),
  
  -- Status
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_tokens_user ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_type ON verification_tokens(token_type);
CREATE INDEX idx_verification_tokens_expires ON verification_tokens(expires_at);

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(p_user_id UUID, p_role VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  completion_count INTEGER := 0;
  total_items INTEGER := 0;
  has_property BOOLEAN;
  has_rental BOOLEAN;
BEGIN
  -- Common items for all roles (5 items)
  total_items := 5;
  
  -- Check email verified
  IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND email_verified = true) THEN
    completion_count := completion_count + 1;
  END IF;
  
  -- Check phone verified
  IF EXISTS (SELECT 1 FROM taxpayer_profiles WHERE user_id = p_user_id AND phone_verified = true) THEN
    completion_count := completion_count + 1;
  END IF;
  
  -- Check KADIRS ID
  IF EXISTS (SELECT 1 FROM taxpayer_profiles WHERE user_id = p_user_id AND kadirs_id IS NOT NULL) THEN
    completion_count := completion_count + 1;
  END IF;
  
  -- Check profile photo (optional, but counts)
  IF EXISTS (SELECT 1 FROM taxpayer_profiles WHERE user_id = p_user_id AND profile_photo_url IS NOT NULL) THEN
    completion_count := completion_count + 1;
  END IF;
  
  -- Check basic profile details
  IF EXISTS (
    SELECT 1 FROM taxpayer_profiles 
    WHERE user_id = p_user_id 
    AND gender IS NOT NULL 
    AND date_of_birth IS NOT NULL
  ) THEN
    completion_count := completion_count + 1;
  END IF;
  
  -- Role-specific items
  IF p_role IN ('taxpayer', 'property_manager') THEN
    total_items := total_items + 1;
    -- Check if at least one property registered
    SELECT EXISTS (SELECT 1 FROM properties WHERE owner_id = p_user_id) INTO has_property;
    IF has_property THEN
      completion_count := completion_count + 1;
    END IF;
  END IF;
  
  IF p_role = 'tenant' THEN
    total_items := total_items + 1;
    -- Check if at least one rental linked
    SELECT EXISTS (SELECT 1 FROM tenant_rentals WHERE tenant_id = p_user_id AND is_active = true) INTO has_rental;
    IF has_rental THEN
      completion_count := completion_count + 1;
    END IF;
  END IF;
  
  -- Calculate percentage
  RETURN ROUND((completion_count::DECIMAL / total_items::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for verification_tokens
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verification_tokens_select_own" ON verification_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "verification_tokens_insert_own" ON verification_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE verification_tokens IS 'Stores OTP tokens for email and phone verification';
COMMENT ON FUNCTION calculate_profile_completion IS 'Calculates profile completion percentage based on user role';
