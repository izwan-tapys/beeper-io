-- Migration: Fix Database Security Warnings (Supabase Linter)
-- Description: Resolves linter warnings regarding mutable search paths, exposed SECURITY DEFINER functions, and overly permissive RLS policies.
-- Date: 2026-06-12

-- 1. Fix Mutable Search Path for SECURITY DEFINER Functions
-- Adding explicit search path prevents potential hijacking of functions
ALTER FUNCTION get_targeted_ads(double precision, double precision, text, text) SET search_path = public;
ALTER FUNCTION track_ad_event(uuid, uuid, text) SET search_path = public;
ALTER FUNCTION rls_auto_enable() SET search_path = public;

-- 2. Restrict Execution Privileges on Internal SECURITY DEFINER Functions
-- Public get_targeted_ads needs to remain executable by anon/authenticated for the client-side pager.
-- track_ad_event and rls_auto_enable are internal/legacy and should NOT be publicly executable.
REVOKE EXECUTE ON FUNCTION track_ad_event(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- 3. Drop Redundant / Overly Permissive Legacy RLS Policies
-- ad_wallet_transactions: Clients must never insert/update directly (only Server-side API with service_role)
DROP POLICY IF EXISTS "Allow public insert to ad_wallet_transactions" ON ad_wallet_transactions;
DROP POLICY IF EXISTS "Allow public update to ad_wallet_transactions" ON ad_wallet_transactions;

-- sessions: Drop redundant legacy public update/insert policies
DROP POLICY IF EXISTS "Allow public insert session" ON sessions;
DROP POLICY IF EXISTS "Allow public to update session status" ON sessions;
DROP POLICY IF EXISTS "Public can confirm their pager" ON sessions;

-- 4. Harden Public Update Policy on sessions Table
-- Restrict updates so they can only happen on active sessions ('waiting' or 'called')
DROP POLICY IF EXISTS "Allow public update session confirmation" ON sessions;
CREATE POLICY "Allow public update session confirmation"
ON sessions FOR UPDATE TO anon, authenticated
USING (status IN ('waiting', 'called'))
WITH CHECK (status IN ('waiting', 'called'));
