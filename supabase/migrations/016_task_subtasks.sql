-- =============================================================================
-- Phase 18: Add subtasks JSONB column to tasks
-- =============================================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS subtasks JSONB NOT NULL DEFAULT '[]'::jsonb;
