-- Create property ownership history table for audit trail
CREATE TABLE IF NOT EXISTS property_ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  previous_owner_id UUID NOT NULL REFERENCES users(id),
  new_owner_id UUID NOT NULL REFERENCES users(id),
  transferred_by UUID REFERENCES users(id), -- Admin who performed the transfer
  transfer_notes TEXT,
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_property_ownership_history_property_id ON property_ownership_history(property_id);
CREATE INDEX IF NOT EXISTS idx_property_ownership_history_new_owner_id ON property_ownership_history(new_owner_id);
CREATE INDEX IF NOT EXISTS idx_property_ownership_history_previous_owner_id ON property_ownership_history(previous_owner_id);

-- Enable RLS
ALTER TABLE property_ownership_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all ownership history
CREATE POLICY "Admins can view all ownership history"
  ON property_ownership_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: System can insert ownership history records
CREATE POLICY "System can insert ownership history"
  ON property_ownership_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
