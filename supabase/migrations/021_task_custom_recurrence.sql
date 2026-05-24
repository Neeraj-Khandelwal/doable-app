-- Migration 021: Add fortnightly and custom recurrence to tasks
-- Run this in Supabase SQL Editor

-- 1. Drop the old recurrence check constraint (only allowed none/daily/weekly/monthly)
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_recurrence_check;

-- 2. Add updated constraint that includes the new values
ALTER TABLE tasks ADD CONSTRAINT tasks_recurrence_check
  CHECK (recurrence IN ('none', 'daily', 'weekly', 'fortnightly', 'monthly', 'custom'));

-- 3. Add custom_recurrence_days column (used when recurrence = 'custom')
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS custom_recurrence_days INTEGER
  CHECK (custom_recurrence_days > 0 AND custom_recurrence_days <= 365);
