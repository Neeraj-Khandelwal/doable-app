-- =============================================================================
-- Doable App — Habit Tracking Tables
-- Run this after 001_initial_schema.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS habits (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by    UUID        NOT NULL,
  title         TEXT        NOT NULL,
  description   TEXT,
  assignees     TEXT[]      NOT NULL DEFAULT '{}',
  category      TEXT        NOT NULL DEFAULT 'other',
  frequency     TEXT        NOT NULL DEFAULT 'daily',
  frequency_days INTEGER[],                      -- [0..6] Sun=0, used when frequency='custom'
  target_count  INTEGER     NOT NULL DEFAULT 1,  -- completions required per scheduled day
  icon          TEXT        NOT NULL DEFAULT '✅',
  reminder_time TEXT,                            -- HH:MM 24h
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id     UUID        NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  family_id    UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  completed_by TEXT        NOT NULL,  -- 'me' or kid_profile id
  date         DATE        NOT NULL,  -- YYYY-MM-DD, the day this completion counts for
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_habits_family_id           ON habits(family_id);
CREATE INDEX IF NOT EXISTS idx_habits_family_active        ON habits(family_id, is_active);
CREATE INDEX IF NOT EXISTS idx_hc_habit_id               ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_hc_family_date            ON habit_completions(family_id, date);
CREATE INDEX IF NOT EXISTS idx_hc_habit_assignee_date    ON habit_completions(habit_id, completed_by, date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_habits_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS habits_updated_at ON habits;
CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_habits_updated_at();

-- RLS disabled for development (enable via 002_enable_rls.sql pattern before production)
ALTER TABLE habits            DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions DISABLE ROW LEVEL SECURITY;
