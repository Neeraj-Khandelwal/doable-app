-- Unified kid point events: covers habit streak bonuses AND parent adhoc awards/deductions.
-- Replaces the earlier habit_streak_bonuses table.

DROP TABLE IF EXISTS habit_streak_bonuses;

CREATE TABLE IF NOT EXISTS kid_point_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id      TEXT        NOT NULL,
  family_id   UUID        NOT NULL,
  points      INTEGER     NOT NULL,          -- positive = award, negative = deduction
  reason      TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'adhoc', -- 'adhoc' | 'streak_bonus'
  habit_id    UUID        REFERENCES habits(id) ON DELETE SET NULL,
  created_by  TEXT        NOT NULL,          -- user_id who created the event
  event_date  TEXT        NOT NULL,          -- YYYY-MM-DD
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kid_point_events_family
  ON kid_point_events (family_id, event_date DESC);

ALTER TABLE kid_point_events DISABLE ROW LEVEL SECURITY;
