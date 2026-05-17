-- =============================================================================
-- Migration 018: Track who added each grocery item
-- Run in Supabase SQL Editor
-- =============================================================================

ALTER TABLE grocery_items
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES auth.users(id);
