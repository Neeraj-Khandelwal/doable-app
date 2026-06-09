ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS relationship TEXT
CHECK (relationship IN ('partner', 'parent', 'sibling', 'other'));
