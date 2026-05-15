-- =============================================================================
-- Phase 14: Task Assignment with Accept/Reject + Privacy Model
-- =============================================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assignment_status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (assignment_status IN ('pending_acceptance', 'accepted', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- Backfill: all existing tasks stay accepted and non-private (preserve visibility)
UPDATE tasks SET assignment_status = 'accepted', is_private = false
WHERE assignment_status = 'accepted';

-- Update SELECT policy: personal/assigned tasks respect privacy
DROP POLICY IF EXISTS "tsk_sel" ON tasks;
CREATE POLICY "tsk_sel" ON tasks
  FOR SELECT USING (
    -- Creator always sees their own tasks
    created_by = auth.uid()
    -- Assignee always sees tasks assigned to them
    OR assigned_to_user_id = auth.uid()
    -- Non-private tasks visible to all family members
    OR (is_private = false AND is_family_member(family_id))
  );

-- Update UPDATE policy: creator or assignee can update
DROP POLICY IF EXISTS "tsk_upd" ON tasks;
CREATE POLICY "tsk_upd" ON tasks
  FOR UPDATE USING (
    created_by = auth.uid()
    OR assigned_to_user_id = auth.uid()
  );
