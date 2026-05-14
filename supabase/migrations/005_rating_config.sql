-- =============================================================================
-- Doable App — Custom Rating Configuration
-- Adds a JSONB column to families so parents can configure rating options
-- (labels, emojis, and point values) per family.
-- =============================================================================

ALTER TABLE families
  ADD COLUMN IF NOT EXISTS rating_config JSONB DEFAULT NULL;

-- Example stored value:
-- [
--   { "type": "Awesome", "emoji": "🌟", "points": 5 },
--   { "type": "Good",    "emoji": "👍", "points": 3 },
--   { "type": "Ok Ok",   "emoji": "😐", "points": 1 },
--   { "type": "Very Bad","emoji": "👎", "points": -2 }
-- ]
-- NULL means "use app defaults".
