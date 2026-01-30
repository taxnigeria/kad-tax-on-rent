-- Add verification status and onboarding tracking to taxpayer_profiles
ALTER TABLE taxpayer_profiles
ADD COLUMN IF NOT EXISTS verification_status VARCHAR DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS onboarded_by_id UUID REFERENCES users(id);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES users(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  rate_applied DECIMAL(5, 2) NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_taxpayer_verification ON taxpayer_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);

-- Add commission_rate to users table (optional override per agent)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2) DEFAULT NULL;
