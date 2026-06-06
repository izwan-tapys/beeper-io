-- Partner Referral & Commission System Migration
-- Run this in the Supabase SQL Editor

-- 1. Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  commission_rate FLOAT DEFAULT 0.30,
  bank_name TEXT,
  bank_account_no TEXT,
  bank_account_name TEXT,
  ic_number TEXT,
  company_reg_no TEXT,
  full_address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create merchant_transactions table (billing log per merchant)
CREATE TABLE IF NOT EXISTS merchant_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  amount FLOAT NOT NULL,
  currency TEXT DEFAULT 'MYR',
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'refunded')),
  clearance_status TEXT DEFAULT 'pending_clearance' CHECK (clearance_status IN ('pending_clearance', 'claimable')),
  reference_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create partner_payouts table (audit log of commissions paid out)
CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  amount FLOAT NOT NULL,
  payout_month TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  bank_name_snapshot TEXT,
  bank_account_no_snapshot TEXT,
  bank_account_name_snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on all tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for partners table
DROP POLICY IF EXISTS "Partners can read own profile" ON partners;
CREATE POLICY "Partners can read own profile"
ON partners FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Partners can update own profile" ON partners;
CREATE POLICY "Partners can update own profile"
ON partners FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own partner profile" ON partners;
CREATE POLICY "Users can create own partner profile"
ON partners FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can manage partners" ON partners;
CREATE POLICY "Admin can manage partners"
ON partners FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');

-- 6. RLS Policies for merchant_transactions table
DROP POLICY IF EXISTS "Admin can manage merchant_transactions" ON merchant_transactions;
CREATE POLICY "Admin can manage merchant_transactions"
ON merchant_transactions FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');

DROP POLICY IF EXISTS "Partners can read referred merchant transactions" ON merchant_transactions;
CREATE POLICY "Partners can read referred merchant transactions"
ON merchant_transactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM merchants m
    JOIN partners p ON p.referral_code = m.referred_by
    WHERE m.id = merchant_transactions.merchant_id
      AND p.user_id = auth.uid()
  )
);

-- 7. RLS Policies for partner_payouts table
DROP POLICY IF EXISTS "Partners can read own payouts" ON partner_payouts;
CREATE POLICY "Partners can read own payouts"
ON partner_payouts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM partners WHERE partners.id = partner_payouts.partner_id AND partners.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admin can manage partner_payouts" ON partner_payouts;
CREATE POLICY "Admin can manage partner_payouts"
ON partner_payouts FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com');

-- 8. Automate 14-day clearance_status transition using pg_cron
-- Run daily at 2am to flip pending_clearance -> claimable for transactions older than 14 days
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'clear-partner-commissions';
SELECT cron.schedule(
  'clear-partner-commissions',
  '0 2 * * *',
  $$ UPDATE merchant_transactions SET clearance_status = 'claimable' WHERE clearance_status = 'pending_clearance' AND status = 'completed' AND created_at < NOW() - INTERVAL '14 days' $$
);

-- 9. Add referred_by column to merchants if not exists (should already exist from previous migrations)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS referred_by TEXT;
