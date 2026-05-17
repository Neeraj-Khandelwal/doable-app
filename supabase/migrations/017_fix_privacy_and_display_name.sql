-- =============================================================================
-- Migration 017: Fix task privacy RLS and display name update policy
-- Run in Supabase SQL Editor
-- =============================================================================

-- 1. Fix family_members UPDATE policy: each user can only update their own row.
--    The previous policy allowed any family member to update any other member's row,
--    which let partners accidentally rename each other.
DROP POLICY IF EXISTS "fm_upd" ON family_members;
CREATE POLICY "fm_upd" ON family_members
  FOR UPDATE USING (user_id = auth.uid());

-- 2. Ensure task assignment and privacy columns exist (idempotent — safe if migration 014 was already applied)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID,
  ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT 'accepted',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- 3. Re-apply correct task SELECT policy so private tasks are hidden from other family members.
--    Private tasks (is_private = true) are only visible to creator or the assigned user.
DROP POLICY IF EXISTS "tsk_sel" ON tasks;
CREATE POLICY "tsk_sel" ON tasks
  FOR SELECT USING (
    created_by = auth.uid()
    OR assigned_to_user_id = auth.uid()
    OR (is_private = false AND is_family_member(family_id))
  );

-- 4. Re-apply correct task UPDATE policy (creator or assignee can update)
DROP POLICY IF EXISTS "tsk_upd" ON tasks;
CREATE POLICY "tsk_upd" ON tasks
  FOR UPDATE USING (
    created_by = auth.uid()
    OR assigned_to_user_id = auth.uid()
  );
