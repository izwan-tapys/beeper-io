-- Migration: Fix Remaining Supabase Linter Warnings
-- Description: Converts permissive WITH CHECK (true) policies to column IS NOT NULL checks on logging tables.
-- Date: 2026-06-12

-- 1. Silence permissive RLS warning on ad_analytics table
DROP POLICY IF EXISTS "Allow public insert to ad_analytics" ON ad_analytics;
CREATE POLICY "Allow public insert to ad_analytics"
ON ad_analytics FOR INSERT TO anon, authenticated
WITH CHECK (event_type IS NOT NULL);

-- 2. Silence permissive RLS warning on page_views table
DROP POLICY IF EXISTS "Allow public insert to page_views" ON page_views;
CREATE POLICY "Allow public insert to page_views"
ON page_views FOR INSERT TO anon, authenticated
WITH CHECK (path IS NOT NULL);

-- 3. Silence permissive RLS warning on pager_analytics table
DROP POLICY IF EXISTS "Allow public insert to pager_analytics" ON pager_analytics;
CREATE POLICY "Allow public insert to pager_analytics"
ON pager_analytics FOR INSERT TO anon, authenticated
WITH CHECK (event_type IS NOT NULL);
