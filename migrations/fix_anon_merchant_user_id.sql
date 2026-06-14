-- Migration: Grant SELECT on user_id to anon role
-- Description: Allows PostgreSQL to evaluate RLS policies on the sessions table for anonymous users
--              without throwing "permission denied for table merchants".
-- Date: 2026-06-14

GRANT SELECT (user_id) ON TABLE public.merchants TO anon;
