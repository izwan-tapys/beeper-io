-- Migration: Custom Page Views (Visitor) Tracking
-- Run this in Supabase SQL Editor

-- 1. Create page_views table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  referrer TEXT,
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- 3. Allow any visitor (anon/authenticated) to INSERT
DROP POLICY IF EXISTS "Allow public insert to page_views" ON page_views;
CREATE POLICY "Allow public insert to page_views"
ON page_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 4. Allow admin to read and manage all page views
DROP POLICY IF EXISTS "Allow admin to manage page_views" ON page_views;
CREATE POLICY "Allow admin to manage page_views"
ON page_views FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');

-- 5. Indexes for fast aggregation queries
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
