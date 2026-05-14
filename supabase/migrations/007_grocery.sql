-- =============================================================================
-- Doable App — Grocery List
-- Shared family grocery list with real-time sync.
-- Only owner and partner can access (kids excluded via RLS in production).
-- =============================================================================

CREATE TABLE IF NOT EXISTS grocery_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name         TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reuse the existing updated_at trigger function from migration 001
CREATE OR REPLACE TRIGGER trg_grocery_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS disabled for dev (consistent with all other tables)
ALTER TABLE grocery_items DISABLE ROW LEVEL SECURITY;

-- Production-ready policies (owner/partner family members only)
CREATE POLICY "gi_sel" ON grocery_items FOR SELECT USING (is_family_member(family_id));
CREATE POLICY "gi_ins" ON grocery_items FOR INSERT WITH CHECK (is_family_member(family_id));
CREATE POLICY "gi_upd" ON grocery_items FOR UPDATE USING (is_family_member(family_id));
CREATE POLICY "gi_del" ON grocery_items FOR DELETE USING (is_family_member(family_id));

-- Enable real-time broadcasts for this table
ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;

-- Index for family lookups
CREATE INDEX IF NOT EXISTS idx_grocery_items_family
  ON grocery_items (family_id, is_purchased, created_at);
