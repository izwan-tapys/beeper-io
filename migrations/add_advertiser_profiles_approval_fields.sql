-- Migration: Add advertiser approval status and registration fields
-- Description: Adds status, business_name, phone, advertised_products, rejection_reason to advertiser_profiles.
--              Merchants now need admin approval before accessing the Ads Manager dashboard.
-- Date: 2026-06-13

ALTER TABLE public.advertiser_profiles 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS advertised_products TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Optional: Add a status check constraint
ALTER TABLE public.advertiser_profiles
  DROP CONSTRAINT IF EXISTS advertiser_profiles_status_check;

ALTER TABLE public.advertiser_profiles
  ADD CONSTRAINT advertiser_profiles_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));
