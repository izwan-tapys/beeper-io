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
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS upsell_cta_text TEXT;
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

-- 8. Add email column to merchants table for admin dashboard
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email TEXT;

-- 9. Add database indexes to optimize read queries (Jimat Compute/Kos)
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_merchant_status ON sessions(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_ad_id ON ad_analytics(ad_id);

-- 10. Add geolocation and category columns to merchants table
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS latitude FLOAT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS longitude FLOAT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS category TEXT;

-- 11. Add ad targeting, bidding, and advertiser columns to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_latitude FLOAT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_longitude FLOAT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_radius_km FLOAT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS cpv_bid FLOAT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_review';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS advertiser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS cta_text TEXT;

-- 12. Create advertiser_profiles table
CREATE TABLE IF NOT EXISTS advertiser_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  wallet_balance FLOAT DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on advertiser_profiles
ALTER TABLE advertiser_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile
DROP POLICY IF EXISTS "Advertiser can read own profile" ON advertiser_profiles;
CREATE POLICY "Advertiser can read own profile"
ON advertiser_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Advertiser can update own profile" ON advertiser_profiles;
CREATE POLICY "Advertiser can update own profile"
ON advertiser_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Advertiser can insert own profile" ON advertiser_profiles;
CREATE POLICY "Advertiser can insert own profile"
ON advertiser_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow admin full control over advertiser_profiles
DROP POLICY IF EXISTS "Allow admin to manage advertiser_profiles" ON advertiser_profiles;
CREATE POLICY "Allow admin to manage advertiser_profiles"
ON advertiser_profiles FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');

-- 13. Create ad_wallet_transactions table
CREATE TABLE IF NOT EXISTS ad_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  amount FLOAT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topup', 'debit')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on ad_wallet_transactions
ALTER TABLE ad_wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated to INSERT (for debit from pager device)
DROP POLICY IF EXISTS "Allow public insert to ad_wallet_transactions" ON ad_wallet_transactions;
CREATE POLICY "Allow public insert to ad_wallet_transactions"
ON ad_wallet_transactions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow admin full control over ad_wallet_transactions
DROP POLICY IF EXISTS "Allow admin to manage ad_wallet_transactions" ON ad_wallet_transactions;
CREATE POLICY "Allow admin to manage ad_wallet_transactions"
ON ad_wallet_transactions FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');

-- 14. Create get_targeted_ads function using Haversine formula
CREATE OR REPLACE FUNCTION get_targeted_ads(p_lat FLOAT, p_lng FLOAT, m_category TEXT)
RETURNS SETOF ads
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ads.*
  FROM ads
  WHERE
    ads.is_active = true
    AND ads.status = 'active'
    AND ads.advertiser_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM advertiser_profiles ap
      WHERE ap.user_id = ads.advertiser_id
        AND ap.wallet_balance > 0
    )
    AND (ads.category IS NULL OR ads.category != m_category)
    AND (
      -- Global ads: no geolocation target set
      ads.target_latitude IS NULL
      OR
      -- Location-targeted ads: within radius using Haversine formula
      (
        ads.target_radius_km IS NULL
        OR
        (
          6371.0 * 2 * ASIN(
            SQRT(
              POWER(SIN(RADIANS(p_lat - ads.target_latitude) / 2), 2) +
              COS(RADIANS(p_lat)) * COS(RADIANS(ads.target_latitude)) *
              POWER(SIN(RADIANS(p_lng - ads.target_longitude) / 2), 2)
            )
          )
        ) <= ads.target_radius_km
      )
    )
  ORDER BY ads.cpv_bid DESC NULLS LAST;
END;
$$;

-- 15. Add RLS policies to ads table for advertisers to manage their own ads
-- Allow authenticated advertiser to insert their own ads
DROP POLICY IF EXISTS "Advertiser can insert own ads" ON ads;
CREATE POLICY "Advertiser can insert own ads"
ON ads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = advertiser_id);

-- Allow authenticated advertiser to read their own ads
DROP POLICY IF EXISTS "Advertiser can read own ads" ON ads;
CREATE POLICY "Advertiser can read own ads"
ON ads FOR SELECT
TO authenticated
USING (auth.uid() = advertiser_id);

-- Allow authenticated advertiser to update their own ads (only when pending_review or paused)
DROP POLICY IF EXISTS "Advertiser can update own ads" ON ads;
CREATE POLICY "Advertiser can update own ads"
ON ads FOR UPDATE
TO authenticated
USING (auth.uid() = advertiser_id AND status IN ('pending_review', 'paused'))
WITH CHECK (auth.uid() = advertiser_id);

-- 16. Update the public read policy on ads to also require status = 'active'
DROP POLICY IF EXISTS "Allow public read access to active ads" ON ads;
CREATE POLICY "Allow public read access to active ads"
ON ads FOR SELECT
TO anon, authenticated
USING (is_active = true AND status = 'active');

-- 17. Allow advertisers to select their own ad analytics
DROP POLICY IF EXISTS "Advertiser can read own ad analytics" ON ad_analytics;
CREATE POLICY "Advertiser can read own ad analytics"
ON ad_analytics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ads
    WHERE ads.id = ad_analytics.ad_id
      AND ads.advertiser_id = auth.uid()
  )
);

-- 18. Add columns for state & category targeting and update get_targeted_ads function
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_states TEXT[];
ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_categories TEXT[];

-- Drop the old 3-parameter function signature to prevent overload conflict
DROP FUNCTION IF EXISTS get_targeted_ads(FLOAT, FLOAT, TEXT);

-- Create new 4-parameter function signature
CREATE OR REPLACE FUNCTION get_targeted_ads(
  p_lat FLOAT, 
  p_lng FLOAT, 
  m_state TEXT, 
  m_category TEXT
)
RETURNS SETOF ads
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ads.*
  FROM ads
  WHERE
    ads.is_active = true
    AND ads.status = 'active'
    AND ads.advertiser_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM advertiser_profiles ap
      WHERE ap.user_id = ads.advertiser_id
        AND ap.wallet_balance > 0
    )
    AND (ads.category IS NULL OR ads.category != m_category)
    AND (
      ads.target_states IS NULL 
      OR cardinality(ads.target_states) = 0 
      OR (m_state IS NOT NULL AND m_state = ANY(ads.target_states))
    )
    AND (
      ads.target_categories IS NULL 
      OR cardinality(ads.target_categories) = 0 
      OR (m_category IS NOT NULL AND m_category = ANY(ads.target_categories))
    )
    AND (
      ads.target_latitude IS NULL
      OR
      (
        p_lat IS NOT NULL 
        AND p_lng IS NOT NULL 
        AND (
          ads.target_radius_km IS NULL
          OR
          (
            6371.0 * 2 * ASIN(
              SQRT(
                POWER(SIN(RADIANS(p_lat - ads.target_latitude) / 2), 2) +
                COS(RADIANS(p_lat)) * COS(RADIANS(ads.target_latitude)) *
                POWER(SIN(RADIANS(p_lng - ads.target_longitude) / 2), 2)
              )
            ) <= ads.target_radius_km
          )
        )
      )
    )
  ORDER BY ads.cpv_bid DESC NULLS LAST;
END;
$$;

-- 19. Create track_ad_event RPC for transactional tracking and wallet deduction
CREATE OR REPLACE FUNCTION track_ad_event(
  p_ad_id UUID,
  p_session_id UUID,
  p_event_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cpv_bid FLOAT;
  v_advertiser_id UUID;
  v_wallet_balance FLOAT;
  v_merchant_id UUID;
BEGIN
  -- If event is 'impression', check for deduplication
  IF p_event_type = 'impression' THEN
    IF EXISTS (
      SELECT 1 FROM ad_analytics
      WHERE ad_id = p_ad_id AND session_id = p_session_id AND event_type = 'impression'
    ) THEN
      -- Already tracked for this session, exit early
      RETURN TRUE;
    END IF;
  END IF;

  -- Get ad details
  SELECT cpv_bid, advertiser_id INTO v_cpv_bid, v_advertiser_id
  FROM ads WHERE id = p_ad_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get session's merchant_id
  IF p_session_id IS NOT NULL THEN
    SELECT merchant_id INTO v_merchant_id
    FROM sessions WHERE id = p_session_id;
  END IF;

  -- Wallet deduction is only for impressions in a CPV model
  IF p_event_type = 'impression' THEN
    -- Check wallet balance
    IF v_advertiser_id IS NOT NULL THEN
      SELECT wallet_balance INTO v_wallet_balance
      FROM advertiser_profiles WHERE user_id = v_advertiser_id FOR UPDATE;

      IF v_wallet_balance >= v_cpv_bid THEN
        -- Deduct from wallet
        UPDATE advertiser_profiles
        SET wallet_balance = wallet_balance - v_cpv_bid
        WHERE user_id = v_advertiser_id;

        -- Log transaction
        INSERT INTO ad_wallet_transactions (advertiser_id, ad_id, session_id, amount, type)
        SELECT id, p_ad_id, p_session_id, v_cpv_bid, 'debit'
        FROM advertiser_profiles WHERE user_id = v_advertiser_id;
      ELSE
        -- Insufficient balance
        RETURN FALSE;
      END IF;
    END IF;

    -- Update impressions count
    UPDATE ads SET impressions_count = COALESCE(impressions_count, 0) + 1 WHERE id = p_ad_id;
  END IF;

  -- Log analytics
  INSERT INTO ad_analytics (ad_id, merchant_id, session_id, event_type)
  VALUES (p_ad_id, v_merchant_id, p_session_id, p_event_type);

  RETURN TRUE;
END;
$$;

-- 20. Update ad_wallet_transactions for ToyyibPay
ALTER TABLE ad_wallet_transactions ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE ad_wallet_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed'));