-- Standalone alarms: personal, per-user, independent of tasks/habits.

CREATE TABLE IF NOT EXISTS alarms (
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

-- Patch: add any columns that may be missing if the table was created earlier
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS label       TEXT;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS enabled     BOOLEAN     NOT NULL DEFAULT TRUE;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS repeat_days INTEGER[]   NOT NULL DEFAULT '{}';
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS sound       TEXT        NOT NULL DEFAULT 'default';
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS family_id   UUID        REFERENCES families(id) ON DELETE SET NULL;
ALTER TABLE alarms ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_alarms_user ON alarms (user_id);

ALTER TABLE alarms DISABLE ROW LEVEL SECURITY;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
