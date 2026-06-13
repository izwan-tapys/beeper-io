-- Add email column to partners table if not exists
ALTER TABLE partners ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill emails from auth.users
UPDATE partners p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;
