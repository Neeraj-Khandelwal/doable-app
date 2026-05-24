-- Add habit_points_config JSONB column to families table
ALTER TABLE families ADD COLUMN IF NOT EXISTS habit_points_config JSONB;
