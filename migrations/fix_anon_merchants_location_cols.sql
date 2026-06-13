-- Migration: Fix Anon Column Privileges on merchants
-- Description: Grants SELECT privilege on latitude and longitude to the anon role.
--              This resolves a 42501 permission error when anonymous pager clients
--              fetch merchant info (e.g. when customer scans QR code to open pager).
-- Date: 2026-06-13

GRANT SELECT (latitude, longitude) ON TABLE merchants TO anon;
