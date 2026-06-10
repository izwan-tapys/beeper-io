-- 1. Explicitly restore full privileges for authenticated and service_role on merchants and sessions
GRANT ALL ON TABLE merchants TO authenticated;
GRANT ALL ON TABLE sessions TO authenticated;
GRANT ALL ON TABLE merchants TO service_role;
GRANT ALL ON TABLE sessions TO service_role;

-- Ensure service_role has bypass RLS privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 2. Re-create Admin policies for ALL tables with auth.email() fallback for complete stability

-- Table: merchants
DROP POLICY IF EXISTS "Admin can manage merchants" ON merchants;
CREATE POLICY "Admin can manage merchants"
ON merchants FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- Table: sessions
DROP POLICY IF EXISTS "Admin can manage sessions" ON sessions;
CREATE POLICY "Admin can manage sessions"
ON sessions FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- Table: ads
DROP POLICY IF EXISTS "Allow admin to manage ads" ON ads;
CREATE POLICY "Allow admin to manage ads"
ON ads FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- Table: ad_analytics
DROP POLICY IF EXISTS "Allow admin to manage ad_analytics" ON ad_analytics;
CREATE POLICY "Allow admin to manage ad_analytics"
ON ad_analytics FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- Table: advertiser_profiles
DROP POLICY IF EXISTS "Allow admin to manage advertiser_profiles" ON advertiser_profiles;
CREATE POLICY "Allow admin to manage advertiser_profiles"
ON advertiser_profiles FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- Table: ad_wallet_transactions
DROP POLICY IF EXISTS "Allow admin to manage ad_wallet_transactions" ON ad_wallet_transactions;
CREATE POLICY "Allow admin to manage ad_wallet_transactions"
ON ad_wallet_transactions FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- Table: partners
DROP POLICY IF EXISTS "Admin can manage partners" ON partners;
CREATE POLICY "Admin can manage partners"
ON partners FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- Table: merchant_transactions
DROP POLICY IF EXISTS "Admin can manage merchant_transactions" ON merchant_transactions;
CREATE POLICY "Admin can manage merchant_transactions"
ON merchant_transactions FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- Table: partner_payouts
DROP POLICY IF EXISTS "Admin can manage partner_payouts" ON partner_payouts;
CREATE POLICY "Admin can manage partner_payouts"
ON partner_payouts FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- Table: pager_analytics
DROP POLICY IF EXISTS "Allow admin to manage pager_analytics" ON pager_analytics;
CREATE POLICY "Allow admin to manage pager_analytics"
ON pager_analytics FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- Table: page_views
DROP POLICY IF EXISTS "Allow admin to manage page_views" ON page_views;
CREATE POLICY "Allow admin to manage page_views"
ON page_views FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com' OR auth.email() = 'izwan.tapys@gmail.com');

-- 3. Ensure public active sessions policy is also applied to merchants
DROP POLICY IF EXISTS "Allow public select of active merchant profiles" ON merchants;
CREATE POLICY "Allow public select of active merchant profiles"
ON merchants FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.merchant_id = merchants.id
  )
);
