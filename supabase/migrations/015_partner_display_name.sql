-- =============================================================================
-- Phase 15: Add display_name to family_members
-- =============================================================================

ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS display_name TEXT;
