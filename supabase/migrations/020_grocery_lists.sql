-- Migration 020: Multiple named grocery lists
-- Run this in Supabase SQL Editor

-- 1. Create grocery_lists table
CREATE TABLE IF NOT EXISTS grocery_lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Groceries',
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grocery_lists_family_id ON grocery_lists(family_id);

CREATE TRIGGER set_grocery_lists_updated_at
  BEFORE UPDATE ON grocery_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Add list_id to grocery_items
ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES grocery_lists(id) ON DELETE CASCADE;

-- 3. Migrate existing items: create a default "Groceries" list for each family
--    that already has items, then assign all their items to it
DO $$
DECLARE
  fid UUID;
  lid UUID;
BEGIN
  FOR fid IN
    SELECT DISTINCT family_id FROM grocery_items WHERE list_id IS NULL
  LOOP
    INSERT INTO grocery_lists (family_id, name)
    VALUES (fid, 'Groceries')
    RETURNING id INTO lid;

    UPDATE grocery_items SET list_id = lid
    WHERE family_id = fid AND list_id IS NULL;
  END LOOP;
END $$;

-- 4. RLS — off (consistent with other grocery tables)
ALTER TABLE grocery_lists DISABLE ROW LEVEL SECURITY;
