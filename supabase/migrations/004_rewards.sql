-- =============================================================================
-- Doable App — Points & Rewards Tables
-- Run this after 001_initial_schema.sql
-- Points are computed from tasks.ratings (JSONB); no separate points table needed.
-- =============================================================================

CREATE TABLE IF NOT EXISTS rewards (
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

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id   UUID        NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  family_id   UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  kid_id      TEXT        NOT NULL,    -- kid_profile id
  points_spent INTEGER    NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'approved',  -- auto-approved for MVP
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rewards_family_id         ON rewards(family_id);
CREATE INDEX IF NOT EXISTS idx_rewards_family_active      ON rewards(family_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rr_family_id              ON reward_redemptions(family_id);
CREATE INDEX IF NOT EXISTS idx_rr_kid_id                 ON reward_redemptions(kid_id);
CREATE INDEX IF NOT EXISTS idx_rr_family_kid             ON reward_redemptions(family_id, kid_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rewards_updated_at ON rewards;
CREATE TRIGGER rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION update_rewards_updated_at();

-- RLS disabled for development
ALTER TABLE rewards             DISABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions  DISABLE ROW LEVEL SECURITY;
