-- =============================================================================
-- Migration 023 — Enable Row-Level Security on all remaining tables
-- =============================================================================
-- Enables RLS on the 9 tables that were left open for dev convenience, and
-- adds the missing RLS policies for the `alarms` table.
--
-- All family-scoped tables are restricted to family members via
-- is_family_member(). User-scoped tables (fast_sessions, fasting_goals,
-- alarms) are restricted to the owning auth user.
--
-- The policies for habits, habit_completions, rewards, reward_redemptions,
-- kid_point_events, fast_sessions, fasting_goals, and grocery_items already
-- exist in the schema (created but dormant); this migration simply activates
-- them by enabling RLS.
-- =============================================================================

-- ── Enable RLS ────────────────────────────────────────────────────────────────

ALTER TABLE habits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kid_point_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fast_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_goals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms             ENABLE ROW LEVEL SECURITY;

-- ── Alarms policies (table had no policies defined) ───────────────────────────
-- user_id is stored as TEXT (cast auth.uid() for comparison)

CREATE POLICY "alm_sel" ON alarms FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "alm_ins" ON alarms FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "alm_upd" ON alarms FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "alm_del" ON alarms FOR DELETE USING (user_id = auth.uid()::text);
