import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getNextDueDate, isTaskOverdue, createTask, isKidTask } from './taskModels';
import type { Task } from './taskModels';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return createTask({
    id: 'task-1',
    family_id: 'fam-1',
    created_by: 'user-1',
    title: 'Test task',
    assignees: ['me'],
    ...overrides,
  });
}

// ── getNextDueDate ────────────────────────────────────────────────────────────

describe('getNextDueDate', () => {
  it('returns null for none recurrence', () => {
    expect(getNextDueDate('2026-06-15', 'none')).toBeNull();
  });

  it('adds 1 day for daily', () => {
    expect(getNextDueDate('2026-06-15', 'daily')).toBe('2026-06-16');
  });

  it('adds 7 days for weekly', () => {
    expect(getNextDueDate('2026-06-15', 'weekly')).toBe('2026-06-22');
  });

  it('adds 14 days for fortnightly', () => {
    expect(getNextDueDate('2026-06-15', 'fortnightly')).toBe('2026-06-29');
  });

  it('adds 1 month for monthly', () => {
    expect(getNextDueDate('2026-06-15', 'monthly')).toBe('2026-07-15');
  });

  it('handles month rollover correctly for monthly', () => {
    expect(getNextDueDate('2026-01-31', 'monthly')).toBe('2026-03-03');
  });

  it('adds custom days when recurrence is custom', () => {
    expect(getNextDueDate('2026-06-15', 'custom', 10)).toBe('2026-06-25');
  });

  it('returns null for custom recurrence with no customDays', () => {
    expect(getNextDueDate('2026-06-15', 'custom')).toBeNull();
  });

  it('returns null for custom recurrence with 0 customDays', () => {
    expect(getNextDueDate('2026-06-15', 'custom', 0)).toBeNull();
  });

  it('crosses year boundary correctly for daily', () => {
    expect(getNextDueDate('2026-12-31', 'daily')).toBe('2027-01-01');
  });
});

// ── isTaskOverdue ─────────────────────────────────────────────────────────────

describe('isTaskOverdue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when no due date', () => {
    const task = makeTask({ due_date: null });
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('returns false when task is already completed', () => {
    const task = makeTask({ due_date: '2026-06-10', completed_at: '2026-06-10T09:00:00' });
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('returns true when due date is in the past', () => {
    const task = makeTask({ due_date: '2026-06-14', completed_at: null });
    expect(isTaskOverdue(task)).toBe(true);
  });

  it('returns false when due date is today', () => {
    const task = makeTask({ due_date: '2026-06-15', completed_at: null });
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('returns false when due date is in the future', () => {
    const task = makeTask({ due_date: '2026-06-20', completed_at: null });
    expect(isTaskOverdue(task)).toBe(false);
  });
});

// ── createTask ────────────────────────────────────────────────────────────────

describe('createTask', () => {
  it('uses provided values', () => {
    const task = createTask({ title: 'Buy milk', priority: 'high', category: 'shopping' });
    expect(task.title).toBe('Buy milk');
    expect(task.priority).toBe('high');
    expect(task.category).toBe('shopping');
  });

  it('applies defaults for missing fields', () => {
    const task = createTask({});
    expect(task.priority).toBe('medium');
    expect(task.category).toBe('other');
    expect(task.recurrence).toBe('none');
    expect(task.completed_at).toBeNull();
    expect(task.subtasks).toEqual([]);
    expect(task.ratings).toEqual([]);
    expect(task.is_private).toBe(false);
    expect(task.assignment_status).toBe('accepted');
  });

  it('sets created_at and updated_at as ISO strings', () => {
    const task = createTask({});
    expect(task.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(task.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ── isKidTask ─────────────────────────────────────────────────────────────────

describe('isKidTask', () => {
  it('returns false when only assignee is me', () => {
    expect(isKidTask(makeTask({ assignees: ['me'] }))).toBe(false);
  });

  it('returns true when a kid id is an assignee', () => {
    expect(isKidTask(makeTask({ assignees: ['kid-123'] }))).toBe(true);
  });

  it('returns true when mixed assignees include a kid', () => {
    expect(isKidTask(makeTask({ assignees: ['me', 'kid-123'] }))).toBe(true);
  });

  it('returns false for empty assignees', () => {
    expect(isKidTask(makeTask({ assignees: [] }))).toBe(false);
  });
});
