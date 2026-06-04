-- Migration: Pager Customer Behavior Tracking
-- Run this in Supabase SQL Editor

-- 1. Create pager_analytics table
CREATE TABLE IF NOT EXISTS pager_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  client_uuid UUID,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'page_loaded',
    'warning_dismissed',
    'pager_activated',
    'test_beep_clicked',
    'alarm_dismissed',
    'offline',
    'online',
    'visibility_hidden',
    'visibility_visible',
    'qr_scanner_opened',
    'qr_scanner_closed',
    'qr_code_scanned',
    'heartbeat'
  )),
  -- Duration since page_loaded (seconds) — populated on heartbeat events
  elapsed_seconds INTEGER,
  -- Device metadata
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE pager_analytics ENABLE ROW LEVEL SECURITY;

-- 3. Allow any visitor (anon/authenticated) to INSERT (fire-and-forget tracking)
DROP POLICY IF EXISTS "Allow public insert to pager_analytics" ON pager_analytics;
CREATE POLICY "Allow public insert to pager_analytics"
ON pager_analytics FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 4. Allow admin to read and manage all analytics
DROP POLICY IF EXISTS "Allow admin to manage pager_analytics" ON pager_analytics;
CREATE POLICY "Allow admin to manage pager_analytics"
ON pager_analytics FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');

-- 5. Indexes for fast aggregation queries
CREATE INDEX IF NOT EXISTS idx_pager_analytics_session_id
  ON pager_analytics(session_id);

CREATE INDEX IF NOT EXISTS idx_pager_analytics_event_type
  ON pager_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_pager_analytics_created_at
  ON pager_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pager_analytics_merchant_id
  ON pager_analytics(merchant_id);
