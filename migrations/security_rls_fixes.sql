-- 1. Enable RLS on merchants and sessions
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any to prevent duplicates/errors
DROP POLICY IF EXISTS "Merchants can manage own profile" ON merchants;
DROP POLICY IF EXISTS "Admin can manage merchants" ON merchants;
DROP POLICY IF EXISTS "Allow public select of active merchant profiles" ON merchants;

DROP POLICY IF EXISTS "Merchants can manage own sessions" ON sessions;
DROP POLICY IF EXISTS "Admin can manage sessions" ON sessions;
DROP POLICY IF EXISTS "Allow public read sessions" ON sessions;
DROP POLICY IF EXISTS "Allow public update session confirmation" ON sessions;

-- 3. RLS Policies for merchants table
-- Owners can read, write, and update their own merchant row
CREATE POLICY "Merchants can manage own profile"
ON merchants FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin has full bypass
CREATE POLICY "Admin can manage merchants"
ON merchants FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');

-- Public (anon/authenticated) can select basic merchant info if they have an active session
CREATE POLICY "Allow public select of active merchant profiles"
ON merchants FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.merchant_id = merchants.id
  )
);

-- 4. RLS Policies for sessions table
-- Owners can manage all sessions belonging to their merchant profile
CREATE POLICY "Merchants can manage own sessions"
ON sessions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = sessions.merchant_id
      AND merchants.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM merchants
    WHERE merchants.id = sessions.merchant_id
      AND merchants.user_id = auth.uid()
  )
);

-- Admin has full bypass
CREATE POLICY "Admin can manage sessions"
ON sessions FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');

-- Public can read any session (UUID-based access protection)
CREATE POLICY "Allow public read sessions"
ON sessions FOR SELECT TO anon, authenticated
USING (true);

-- Public can update client_uuid and is_confirmed when registering/activating pager
CREATE POLICY "Allow public update session confirmation"
ON sessions FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. Column-level security on merchants table
-- Restrict anonymous users from reading sensitive columns (email, phone, loyverse_token)
REVOKE SELECT ON TABLE merchants FROM anon;
GRANT SELECT (
  id, name, is_open, logo_url, gmb_url, plan_type, 
  subscription_status, expiry_date, theme_color, 
  upsell_video_url, upsell_image_url, upsell_title, 
  upsell_description, upsell_cta_text, upsell_link_url, 
  state, category, created_at
) ON TABLE merchants TO anon;
