-- Create manager_authorizations table
-- This table tracks which property managers are authorized to manage properties for which owners

CREATE TABLE IF NOT EXISTS manager_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  authorized_by UUID REFERENCES users(id), -- Admin who created the authorization
  authorization_date TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a manager can only have one active authorization per owner
  UNIQUE(manager_id, owner_id, is_active)
);

-- Create indexes for better query performance
CREATE INDEX idx_manager_authorizations_manager ON manager_authorizations(manager_id) WHERE is_active = true;
CREATE INDEX idx_manager_authorizations_owner ON manager_authorizations(owner_id) WHERE is_active = true;
CREATE INDEX idx_manager_authorizations_active ON manager_authorizations(is_active);

-- Add RLS policies
ALTER TABLE manager_authorizations ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all authorizations"
  ON manager_authorizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Managers can view their own authorizations
CREATE POLICY "Managers can view their authorizations"
  ON manager_authorizations
  FOR SELECT
  TO authenticated
  USING (manager_id = auth.uid());

-- Owners can view who is authorized to manage for them
CREATE POLICY "Owners can view their authorizations"
  ON manager_authorizations
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_manager_authorizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manager_authorizations_updated_at
  BEFORE UPDATE ON manager_authorizations
  FOR EACH ROW
  EXECUTE FUNCTION update_manager_authorizations_updated_at();

-- Insert some sample data (optional - remove if not needed)
-- This assumes you have users with role 'property_manager' and 'taxpayer'
COMMENT ON TABLE manager_authorizations IS 'Tracks authorization relationships between property managers and property owners';
COMMENT ON COLUMN manager_authorizations.manager_id IS 'User ID of the property manager';
COMMENT ON COLUMN manager_authorizations.owner_id IS 'User ID of the property owner (taxpayer)';
COMMENT ON COLUMN manager_authorizations.authorized_by IS 'Admin user who created this authorization';
COMMENT ON COLUMN manager_authorizations.is_active IS 'Whether this authorization is currently active';
