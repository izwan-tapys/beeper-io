-- 1. Create ads table for central ad network
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  video_url TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  impressions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add custom upsell & affiliate columns to merchants table
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS upsell_video_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS upsell_image_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS upsell_title TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS upsell_description TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS upsell_link_url TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- 3. Add client_uuid to sessions table for unique customer device tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS client_uuid UUID;

-- 4. Enable Row Level Security (RLS) on ads table
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for ads table
-- Drop existing policies if they exist to prevent errors on rerun
DROP POLICY IF EXISTS "Allow public read access to active ads" ON ads;
DROP POLICY IF EXISTS "Allow admin to manage ads" ON ads;

-- Allow anonymous and authenticated users to read active ads
CREATE POLICY "Allow public read access to active ads"
ON ads FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow the admin (izwan.tapys@gmail.com) full control over ads table
CREATE POLICY "Allow admin to manage ads"
ON ads FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');

-- 6. Setup pg_cron worker to purge completed sessions older than 48 hours
-- Enable pg_cron extension if not enabled (requires superuser, can be run on Supabase UI)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule first if it exists to avoid duplicate schedules
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'purge-completed-sessions';

-- Schedule the purge job to run daily at 3:00 AM
SELECT cron.schedule(
  'purge-completed-sessions',
  '0 3 * * *',
  $$ DELETE FROM sessions WHERE status = 'completed' AND created_at < NOW() - INTERVAL '48 hours' $$
);

-- 7. Create ad_analytics table for click/impression tracking
CREATE TABLE IF NOT EXISTS ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anon/authenticated) so customer pager can log clicks & impressions
DROP POLICY IF EXISTS "Allow public insert to ad_analytics" ON ad_analytics;
CREATE POLICY "Allow public insert to ad_analytics"
ON ad_analytics FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow admin to read and manage all analytics
DROP POLICY IF EXISTS "Allow admin to manage ad_analytics" ON ad_analytics;
CREATE POLICY "Allow admin to manage ad_analytics"
ON ad_analytics FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');
