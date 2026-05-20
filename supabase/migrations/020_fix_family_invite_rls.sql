-- Allow any authenticated user to read the families table.
-- This is required so a user without a family can look up a family
-- by invite code before joining. Without this, the RLS policy blocks
-- the SELECT and the join flow silently fails.
-- Family data (name, invite_code) is low-sensitivity for a family app.

DROP POLICY IF EXISTS "fam_sel" ON families;

CREATE POLICY "fam_sel" ON families FOR SELECT
  USING (auth.uid() IS NOT NULL);
