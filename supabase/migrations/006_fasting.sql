-- =============================================================================
-- Doable App — Intermittent Fasting Tracker
-- Tables: fast_sessions (one row per fast), fasting_goals (one row per user)
-- =============================================================================

-- Active and completed fasting sessions
CREATE TABLE IF NOT EXISTS fast_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id     UUID REFERENCES families(id) ON DELETE SET NULL,
  start_time    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time      TIMESTAMPTZ,                        -- NULL = still active
  goal_minutes  INTEGER NOT NULL DEFAULT 960,        -- 16 h default
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One goal row per user (upsert on change)
CREATE TABLE IF NOT EXISTS fasting_goals (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_hours  INTEGER NOT NULL DEFAULT 16,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS disabled for dev (same pattern as all other tables in this project)
ALTER TABLE fast_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_goals DISABLE ROW LEVEL SECURITY;

-- Policies exist for when RLS is enabled in production
CREATE POLICY "fs_sel" ON fast_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fs_ins" ON fast_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fs_upd" ON fast_sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "fs_del" ON fast_sessions FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "fg_sel" ON fasting_goals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "fg_ins" ON fasting_goals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "fg_upd" ON fasting_goals FOR UPDATE USING (user_id = auth.uid());

-- Index for fast lookup of active sessions
CREATE INDEX IF NOT EXISTS idx_fast_sessions_user_active
  ON fast_sessions (user_id, end_time)
  WHERE end_time IS NULL;
