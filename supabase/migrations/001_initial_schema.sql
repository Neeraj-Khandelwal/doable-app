-- =============================================================================
-- Doable App — Initial Schema Migration
-- Run in Supabase SQL Editor to set up a fresh database from scratch.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. HELPER FUNCTION
-- SECURITY DEFINER bypasses RLS on family_members so other table policies
-- can call it without hitting a circular dependency.
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 2. TABLES
-- -----------------------------------------------------------------------------

-- families
CREATE TABLE IF NOT EXISTS families (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE,
  max_members INTEGER NOT NULL DEFAULT 6,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- family_members
CREATE TABLE IF NOT EXISTS family_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner', 'partner')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_id, user_id)
);

-- kid_profiles
CREATE TABLE IF NOT EXISTS kid_profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL CHECK (color IN ('lavender','peach','mint','sky','amber','rose')),
  "order"    INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tasks (family-scoped, multi-assignee)
CREATE TABLE IF NOT EXISTS tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by     UUID NOT NULL REFERENCES auth.users(id),
  title          TEXT NOT NULL,
  description    TEXT,
  assignees      TEXT[] NOT NULL DEFAULT '{}',
  due_date       DATE,
  reminder_time  TIME,
  reminder_type  TEXT CHECK (reminder_type IN ('notification','alarm','nudge')),
  nudge_interval INTEGER CHECK (nudge_interval IN (5,10,15,30,60)),
  priority       TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  category       TEXT NOT NULL DEFAULT 'other'
                   CHECK (category IN ('home','work','health','shopping','kids','school','finance','other')),
  recurrence     TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekly','monthly')),
  completed_by   UUID REFERENCES auth.users(id),
  completed_at   TIMESTAMPTZ,
  ratings        JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  avatar_url   TEXT,
  timezone     TEXT DEFAULT 'UTC',
  total_points INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. UPDATED_AT TRIGGERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- NOTE: During development, RLS is disabled on families, family_members,
-- kid_profiles, and tasks to avoid cross-table policy evaluation issues.
-- Run 002_enable_rls.sql before going to production.
-- -----------------------------------------------------------------------------

ALTER TABLE families       DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE kid_profiles   DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          DISABLE ROW LEVEL SECURITY;
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
-- SELECT: own row is always visible; other rows visible if already a member
CREATE POLICY "fm_sel"  ON family_members
  FOR SELECT USING (user_id = auth.uid() OR is_family_member(family_id));
-- INSERT: users can only add themselves (createFamily / joinFamily)
CREATE POLICY "fm_ins"  ON family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fm_upd"  ON family_members
  FOR UPDATE USING (is_family_member(family_id));
CREATE POLICY "fm_del"  ON family_members
  FOR DELETE USING (is_family_member(family_id));

-- kid_profiles
CREATE POLICY "kp_sel"  ON kid_profiles
  FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "kp_ins"  ON kid_profiles
  FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "kp_upd"  ON kid_profiles
  FOR UPDATE USING (is_family_member(family_id));
CREATE POLICY "kp_del"  ON kid_profiles
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
CREATE POLICY "up_sel"  ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "up_ins"  ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "up_upd"  ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
