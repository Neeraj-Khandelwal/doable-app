-- Migration 021: Add fortnightly and custom recurrence to tasks
-- Run this in Supabase SQL Editor

-- Add custom_recurrence_days column (used when recurrence = 'custom')
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS custom_recurrence_days INTEGER CHECK (custom_recurrence_days > 0 AND custom_recurrence_days <= 365);

-- Note: the recurrence column is TEXT — no ALTER needed, new values
-- ('fortnightly', 'custom') are accepted automatically.
