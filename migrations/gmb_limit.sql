-- Migration: Google Review Monthly Limit (Freemium)
-- Run this in Supabase SQL Editor

-- 1. Kemas kini CHECK constraint untuk membenarkan 'gmb_click' sebagai event_type
ALTER TABLE ad_analytics DROP CONSTRAINT IF EXISTS ad_analytics_event_type_check;
ALTER TABLE ad_analytics ADD CONSTRAINT ad_analytics_event_type_check 
  CHECK (event_type IN ('impression', 'click', 'gmb_click'));

-- 2. Tambah kolom penjejakan notifikasi bulanan pada merchants
--    Format: 'YYYY-MM' (cth: '2026-06') untuk semak sama ada notifikasi sudah dihantar bulan ini
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS gmb_alert_80_sent_month TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS gmb_alert_100_sent_month TEXT;

-- 3. Cipta indeks untuk mempercepatkan kueri kiraan klik GMB bulanan
CREATE INDEX IF NOT EXISTS idx_ad_analytics_gmb_clicks 
  ON ad_analytics(merchant_id, event_type, created_at)
  WHERE event_type = 'gmb_click';
