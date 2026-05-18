-- =============================================================================
-- DOABLE APP — COMPLETE SCHEMA (single-file reset)
-- =============================================================================
-- WARNING: This drops every table and recreates the schema from scratch.
--          ALL DATA WILL BE PERMANENTLY DELETED.
-- Run once in Supabase SQL Editor on a fresh or reset project.
-- =============================================================================


-- =============================================================================
-- SECTION 1 — TEARDOWN (drop everything in dependency order)
-- =============================================================================

-- Storage policies (safe to drop via SQL)
DROP POLICY IF EXISTS "moment_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "moment_photos_select"  ON storage.objects;
DROP POLICY IF EXISTS "moment_photos_delete"  ON storage.objects;

-- NOTE: The moment-photos Storage bucket cannot be deleted via SQL.
-- If you need a clean bucket, go to:
--   Supabase Dashboard → Storage → moment-photos → Delete bucket
-- (only needed if you want to wipe existing photos)

-- Tables — most-dependent first so FK constraints don't block drops
DROP TABLE IF EXISTS kid_point_events    CASCADE;
DROP TABLE IF EXISTS habit_completions   CASCADE;
DROP TABLE IF EXISTS habits              CASCADE;
DROP TABLE IF EXISTS reward_redemptions  CASCADE;
DROP TABLE IF EXISTS rewards             CASCADE;
DROP TABLE IF EXISTS fast_sessions       CASCADE;
DROP TABLE IF EXISTS fasting_goals       CASCADE;
DROP TABLE IF EXISTS grocery_items       CASCADE;
DROP TABLE IF EXISTS alarms              CASCADE;
DROP TABLE IF EXISTS fcm_tokens          CASCADE;
DROP TABLE IF EXISTS tasks               CASCADE;
DROP TABLE IF EXISTS kid_profiles        CASCADE;
DROP TABLE IF EXISTS user_profiles       CASCADE;
DROP TABLE IF EXISTS family_members      CASCADE;
DROP TABLE IF EXISTS families            CASCADE;

-- Functions
DROP FUNCTION IF EXISTS is_family_member(uuid)       CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column()   CASCADE;
DROP FUNCTION IF EXISTS update_habits_updated_at()   CASCADE;
DROP FUNCTION IF EXISTS update_rewards_updated_at()  CASCADE;


-- =============================================================================
-- SECTION 2 — HELPER FUNCTIONS
-- =============================================================================

-- Membership check used by all RLS policies.
-- SECURITY DEFINER bypasses RLS on family_members to avoid circular dependency.
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

-- Generic updated_at trigger function (reused by all tables that have updated_at).
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- SECTION 3 — TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- families
-- -----------------------------------------------------------------------------
CREATE TABLE families (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  invite_code   TEXT        UNIQUE,
  max_members   INTEGER     NOT NULL DEFAULT 6,
  rating_config JSONB       DEFAULT NULL,  -- custom rating labels/points per family
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- family_members
-- -----------------------------------------------------------------------------
CREATE TABLE family_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL CHECK (role IN ('owner','partner')),
  display_name TEXT,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_id, user_id)
);

-- -----------------------------------------------------------------------------
-- kid_profiles
-- -----------------------------------------------------------------------------
CREATE TABLE kid_profiles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL CHECK (color IN ('lavender','peach','mint','sky','amber','rose')),
  "order"    INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- tasks
-- -----------------------------------------------------------------------------
CREATE TABLE tasks (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id           UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by          UUID        NOT NULL REFERENCES auth.users(id),
  title               TEXT        NOT NULL,
  description         TEXT,
  assignees           TEXT[]      NOT NULL DEFAULT '{}',
  due_date            DATE,
  reminder_time       TIME,
  reminder_type       TEXT        CHECK (reminder_type IN ('notification','alarm','nudge')),
  nudge_interval      INTEGER     CHECK (nudge_interval IN (5,10,15,30,60)),
  priority            TEXT        NOT NULL DEFAULT 'medium'
                                  CHECK (priority IN ('high','medium','low')),
  category            TEXT        NOT NULL DEFAULT 'other'
                                  CHECK (category IN ('home','work','health','shopping','kids','school','finance','other')),
  recurrence          TEXT        NOT NULL DEFAULT 'none'
                                  CHECK (recurrence IN ('none','daily','weekly','monthly')),
  completed_by        UUID        REFERENCES auth.users(id),
  completed_at        TIMESTAMPTZ,
  ratings             JSONB       NOT NULL DEFAULT '[]',
  subtasks            JSONB       NOT NULL DEFAULT '[]',
  -- assignment & privacy (Phase 14)
  assigned_to_user_id UUID        REFERENCES auth.users(id),
  assignment_status   TEXT        NOT NULL DEFAULT 'accepted'
                                  CHECK (assignment_status IN ('pending_acceptance','accepted','rejected')),
  rejection_reason    TEXT,
  responded_at        TIMESTAMPTZ,
  is_private          BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- user_profiles
-- -----------------------------------------------------------------------------
CREATE TABLE user_profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  avatar_url   TEXT,
  timezone     TEXT        DEFAULT 'UTC',
  total_points INTEGER     DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- habits
-- -----------------------------------------------------------------------------
CREATE TABLE habits (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by     UUID        NOT NULL,
  title          TEXT        NOT NULL,
  description    TEXT,
  assignees      TEXT[]      NOT NULL DEFAULT '{}',
  category       TEXT        NOT NULL DEFAULT 'other',
  frequency      TEXT        NOT NULL DEFAULT 'daily',
  frequency_days INTEGER[],
  target_count   INTEGER     NOT NULL DEFAULT 1,
  icon           TEXT        NOT NULL DEFAULT '✅',
  reminder_time  TEXT,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- habit_completions
-- -----------------------------------------------------------------------------
CREATE TABLE habit_completions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id     UUID        NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  family_id    UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  completed_by TEXT        NOT NULL,  -- 'me' or kid_profile id
  date         DATE        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- rewards
-- -----------------------------------------------------------------------------
CREATE TABLE rewards (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by  UUID        NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  icon        TEXT        NOT NULL DEFAULT '🎁',
  points_cost INTEGER     NOT NULL DEFAULT 10 CHECK (points_cost > 0),
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- reward_redemptions
-- -----------------------------------------------------------------------------
CREATE TABLE reward_redemptions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id    UUID        NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  family_id    UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  kid_id       TEXT        NOT NULL,
  points_spent INTEGER     NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'approved',
  redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- kid_point_events
-- -----------------------------------------------------------------------------
CREATE TABLE kid_point_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id      TEXT        NOT NULL,
  family_id   UUID        NOT NULL,
  points      INTEGER     NOT NULL,
  reason      TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'adhoc'
                          CHECK (type IN ('adhoc','streak_bonus','habit_completion','task_rating')),
  habit_id    UUID        REFERENCES habits(id) ON DELETE SET NULL,
  created_by  TEXT        NOT NULL,
  event_date  TEXT        NOT NULL,  -- YYYY-MM-DD
  photo_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- fast_sessions
-- -----------------------------------------------------------------------------
CREATE TABLE fast_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id    UUID        REFERENCES families(id) ON DELETE SET NULL,
  start_time   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time     TIMESTAMPTZ,
  goal_minutes INTEGER     NOT NULL DEFAULT 960,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- fasting_goals
-- -----------------------------------------------------------------------------
CREATE TABLE fasting_goals (
  user_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_hours INTEGER     NOT NULL DEFAULT 16,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- grocery_items
-- -----------------------------------------------------------------------------
CREATE TABLE grocery_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  is_purchased BOOLEAN     NOT NULL DEFAULT FALSE,
  added_by     UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- alarms
-- -----------------------------------------------------------------------------
CREATE TABLE alarms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  family_id   UUID        REFERENCES families(id) ON DELETE SET NULL,
  time        TEXT        NOT NULL,
  label       TEXT,
  enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  repeat_days INTEGER[]   NOT NULL DEFAULT '{}',
  sound       TEXT        NOT NULL DEFAULT 'default',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- fcm_tokens
-- -----------------------------------------------------------------------------
CREATE TABLE fcm_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL UNIQUE,
  token      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- SECTION 4 — TRIGGERS (updated_at)
-- =============================================================================

CREATE TRIGGER trg_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_grocery_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_alarms_updated_at
  BEFORE UPDATE ON alarms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_fcm_tokens_updated_at
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- SECTION 5 — INDEXES
-- =============================================================================

CREATE INDEX idx_habits_family_id        ON habits(family_id);
CREATE INDEX idx_habits_family_active    ON habits(family_id, is_active);
CREATE INDEX idx_hc_habit_id             ON habit_completions(habit_id);
CREATE INDEX idx_hc_family_date          ON habit_completions(family_id, date);
CREATE INDEX idx_hc_habit_assignee_date  ON habit_completions(habit_id, completed_by, date);
CREATE INDEX idx_rewards_family_id       ON rewards(family_id);
CREATE INDEX idx_rewards_family_active   ON rewards(family_id, is_active);
CREATE INDEX idx_rr_family_id            ON reward_redemptions(family_id);
CREATE INDEX idx_rr_kid_id               ON reward_redemptions(kid_id);
CREATE INDEX idx_rr_family_kid           ON reward_redemptions(family_id, kid_id);
CREATE INDEX idx_kid_point_events_family ON kid_point_events(family_id, event_date DESC);
CREATE INDEX idx_fast_sessions_active    ON fast_sessions(user_id, end_time) WHERE end_time IS NULL;
CREATE INDEX idx_grocery_items_family    ON grocery_items(family_id, is_purchased, created_at);
CREATE INDEX idx_alarms_user             ON alarms(user_id);


-- =============================================================================
-- SECTION 6 — ROW LEVEL SECURITY
-- =============================================================================

-- ── Tables with RLS ENABLED ──────────────────────────────────────────────────

ALTER TABLE families       ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kid_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcm_tokens     ENABLE ROW LEVEL SECURITY;

-- ── Tables with RLS DISABLED (dev convenience — enable before full production) ─

ALTER TABLE habits              DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewards             DISABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE kid_point_events    DISABLE ROW LEVEL SECURITY;
ALTER TABLE fast_sessions       DISABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_goals       DISABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items       DISABLE ROW LEVEL SECURITY;
ALTER TABLE alarms              DISABLE ROW LEVEL SECURITY;

-- ── Policies ─────────────────────────────────────────────────────────────────

-- families
CREATE POLICY "fam_sel" ON families FOR SELECT USING (owner_id = auth.uid() OR is_family_member(id));
CREATE POLICY "fam_ins" ON families FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "fam_upd" ON families FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "fam_del" ON families FOR DELETE USING (owner_id = auth.uid());

-- family_members
CREATE POLICY "fm_sel" ON family_members FOR SELECT USING (user_id = auth.uid() OR is_family_member(family_id));
CREATE POLICY "fm_ins" ON family_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fm_upd" ON family_members FOR UPDATE USING (user_id = auth.uid());  -- own row only
CREATE POLICY "fm_del" ON family_members FOR DELETE USING (is_family_member(family_id));

-- kid_profiles
CREATE POLICY "kp_sel" ON kid_profiles FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "kp_ins" ON kid_profiles FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "kp_upd" ON kid_profiles FOR UPDATE USING (is_family_member(family_id));
CREATE POLICY "kp_del" ON kid_profiles FOR DELETE USING (is_family_member(family_id));

-- tasks: private tasks only visible to creator/assignee
CREATE POLICY "tsk_sel" ON tasks FOR SELECT USING (
  created_by = auth.uid()
  OR assigned_to_user_id = auth.uid()
  OR (is_private = false AND is_family_member(family_id))
);
CREATE POLICY "tsk_ins" ON tasks FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "tsk_upd" ON tasks FOR UPDATE USING (
  created_by = auth.uid() OR assigned_to_user_id = auth.uid()
);
CREATE POLICY "tsk_del" ON tasks FOR DELETE USING (is_family_member(family_id));

-- user_profiles
CREATE POLICY "up_sel" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "up_ins" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "up_upd" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- fcm_tokens
CREATE POLICY "fcm_own_row" ON fcm_tokens FOR ALL USING (auth.uid()::text = user_id);

-- Policies that take effect when RLS is later enabled on these tables:

CREATE POLICY "hab_sel" ON habits FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "hab_ins" ON habits FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "hab_upd" ON habits FOR UPDATE USING (is_family_member(family_id));
CREATE POLICY "hab_del" ON habits FOR DELETE USING (is_family_member(family_id));

CREATE POLICY "hc_sel" ON habit_completions FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "hc_ins" ON habit_completions FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "hc_del" ON habit_completions FOR DELETE USING (is_family_member(family_id));

CREATE POLICY "rew_sel" ON rewards FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "rew_ins" ON rewards FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "rew_upd" ON rewards FOR UPDATE USING (is_family_member(family_id));
CREATE POLICY "rew_del" ON rewards FOR DELETE USING (is_family_member(family_id));

CREATE POLICY "rr_sel"  ON reward_redemptions FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "rr_ins"  ON reward_redemptions FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "rr_del"  ON reward_redemptions FOR DELETE USING (is_family_member(family_id));

CREATE POLICY "kpe_sel" ON kid_point_events FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "kpe_ins" ON kid_point_events FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "kpe_del" ON kid_point_events FOR DELETE USING (is_family_member(family_id));

CREATE POLICY "fs_sel" ON fast_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fs_ins" ON fast_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fs_upd" ON fast_sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "fs_del" ON fast_sessions FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "fg_sel" ON fasting_goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fg_ins" ON fasting_goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fg_upd" ON fasting_goals FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "gi_sel" ON grocery_items FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "gi_ins" ON grocery_items FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "gi_upd" ON grocery_items FOR UPDATE USING (is_family_member(family_id));
CREATE POLICY "gi_del" ON grocery_items FOR DELETE USING (is_family_member(family_id));


-- =============================================================================
-- SECTION 7 — REALTIME
-- =============================================================================

-- Enable realtime broadcasts for grocery list (shared live sync between devices)
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;


-- =============================================================================
-- SECTION 8 — STORAGE (moment photos)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('moment-photos', 'moment-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "moment_photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'moment-photos');

CREATE POLICY "moment_photos_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'moment-photos');

CREATE POLICY "moment_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'moment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);


-- =============================================================================
-- Done. Schema created successfully.
-- Tables: families, family_members, kid_profiles, tasks, user_profiles,
--         habits, habit_completions, rewards, reward_redemptions,
--         kid_point_events, fast_sessions, fasting_goals,
--         grocery_items, alarms, fcm_tokens
-- =============================================================================
