-- Migration: Enable Row Level Security on ad_wallet_transactions
-- Description: Resolves Supabase Security Advisor warnings about RLS disabled on public table.
-- Date: 2026-06-12

ALTER TABLE ad_wallet_transactions ENABLE ROW LEVEL SECURITY;
