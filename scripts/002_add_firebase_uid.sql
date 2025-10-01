-- Add firebase_uid column to users table
ALTER TABLE users 
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

-- Create index for firebase_uid lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Update the comment
COMMENT ON COLUMN users.firebase_uid IS 'Firebase Authentication UID';
