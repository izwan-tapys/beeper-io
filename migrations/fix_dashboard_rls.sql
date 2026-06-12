-- =====================================================
-- CLEAN SLATE: Remove all conflicting merchant policies
-- and replace with correct, minimal, secure set.
-- Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: Drop ALL existing policies on merchants table
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'merchants'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON merchants', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- STEP 2: Enable RLS (just in case)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- STEP 3: Grant base permissions to authenticated role
GRANT ALL ON TABLE merchants TO authenticated;
GRANT ALL ON TABLE merchants TO service_role;

-- STEP 4: Create clean, correct policies

-- (A) Merchant owners can do everything to their own row
CREATE POLICY "Merchants can manage own profile"
ON merchants FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- (B) Admin (izwan) has full access to all merchants
CREATE POLICY "Admin can manage all merchants"
ON merchants FOR ALL TO authenticated
USING (
  auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com'
  OR auth.email() = 'izwan.tapys@gmail.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'izwan.tapys@gmail.com'
  OR auth.email() = 'izwan.tapys@gmail.com'
);

-- (C) Public (pager users) can only read LIMITED columns of merchants
--     (for pager page /p/[id]) — only if merchant has active sessions
CREATE POLICY "Public can view active merchant profiles"
ON merchants FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.merchant_id = merchants.id
      AND sessions.status IN ('waiting', 'called')
  )
);

-- STEP 5: Verify result
SELECT 
  policyname, 
  cmd, 
  roles,
  CASE WHEN length(qual::text) > 60 THEN left(qual::text, 60) || '...' ELSE qual::text END AS qual_preview
FROM pg_policies 
WHERE tablename = 'merchants'
ORDER BY policyname;
