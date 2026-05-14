-- =============================================================================
-- Doable App — Enable RLS for Production
-- Run this AFTER 001_initial_schema.sql when ready to go to production.
-- =============================================================================

-- Helper function (SECURITY DEFINER bypasses RLS for membership checks)
CREATE OR REPLACE FUNCTION is_family_member(fid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = fid AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_family_member(uuid) TO anon, authenticated, service_role;

-- Drop all existing policies on these tables
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE tablename IN ('families','family_members','kid_profiles','tasks','user_profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE families       ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kid_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;

-- families
CREATE POLICY "fam_sel" ON families
  FOR SELECT USING (owner_id = auth.uid() OR is_family_member(id));
CREATE POLICY "fam_ins" ON families
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "fam_upd" ON families
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "fam_del" ON families
  FOR DELETE USING (owner_id = auth.uid());

-- family_members
CREATE POLICY "fm_sel" ON family_members
  FOR SELECT USING (user_id = auth.uid() OR is_family_member(family_id));
CREATE POLICY "fm_ins" ON family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fm_upd" ON family_members
  FOR UPDATE USING (is_family_member(family_id));
CREATE POLICY "fm_del" ON family_members
  FOR DELETE USING (is_family_member(family_id));

-- kid_profiles
CREATE POLICY "kp_sel" ON kid_profiles
  FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "kp_ins" ON kid_profiles
  FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "kp_upd" ON kid_profiles
  FOR UPDATE USING (is_family_member(family_id));
CREATE POLICY "kp_del" ON kid_profiles
  FOR DELETE USING (is_family_member(family_id));

-- tasks
CREATE POLICY "tsk_sel" ON tasks
  FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "tsk_ins" ON tasks
  FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "tsk_upd" ON tasks
  FOR UPDATE USING (is_family_member(family_id));
CREATE POLICY "tsk_del" ON tasks
  FOR DELETE USING (is_family_member(family_id));

-- user_profiles
CREATE POLICY "up_sel" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "up_ins" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "up_upd" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
