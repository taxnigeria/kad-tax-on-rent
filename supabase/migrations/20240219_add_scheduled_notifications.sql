-- Add scheduled_for and status columns to notifications_broadcast

ALTER TABLE notifications_broadcast
ADD COLUMN scheduled_for TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived'));

-- Update existing records to have status = 'active' and scheduled_for = created_at
UPDATE notifications_broadcast
SET status = 'active', scheduled_for = created_at
WHERE status IS NULL;

-- Create an index for performance on scheduled queries
CREATE INDEX idx_notifications_broadcast_scheduled_for ON notifications_broadcast(scheduled_for);
CREATE INDEX idx_notifications_broadcast_status ON notifications_broadcast(status);
