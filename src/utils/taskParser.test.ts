import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseTaskText, findTaskByTitle } from './taskParser';
import { createTask } from './taskModels';
import type { KidProfile } from './familyModels';
import type { Task } from './taskModels';

// ── Helpers ───────────────────────────────────────────────────────────────────

const noKids: KidProfile[] = [];

const kids: KidProfile[] = [
  { id: 'kid-1', family_id: 'fam-1', name: 'Alice', color: 'lavender', created_at: '', order: 0 },
  { id: 'kid-2', family_id: 'fam-1', name: 'Bob', color: 'mint', created_at: '', order: 1 },
];

// ── parseTaskText ─────────────────────────────────────────────────────────────

describe('parseTaskText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses a plain title with defaults', () => {
    const result = parseTaskText('Buy groceries', noKids);
    expect(result.title).toBe('Buy groceries');
    expect(result.dueDate).toBeNull();
    expect(result.priority).toBe('medium');
    expect(result.assignees).toEqual(['me']);
  });

  it('extracts "today" as due date', () => {
    const result = parseTaskText('Call dentist today', noKids);
    expect(result.dueDate).toBe('2026-06-15');
    expect(result.title).toBe('Call dentist');
  });

  it('extracts "tomorrow" as due date', () => {
    const result = parseTaskText('Submit report tomorrow', noKids);
    expect(result.dueDate).toBe('2026-06-16');
    expect(result.title).toBe('Submit report');
  });

  it('extracts "next week" as due date', () => {
    const result = parseTaskText('Review budget next week', noKids);
    expect(result.dueDate).toBe('2026-06-22');
  });

  it('extracts "urgent" as high priority', () => {
    const result = parseTaskText('Fix urgent bug', noKids);
    expect(result.priority).toBe('high');
  });

  it('extracts "high priority" as high priority', () => {
    const result = parseTaskText('Submit high priority report', noKids);
    expect(result.priority).toBe('high');
  });

  it('extracts "low" as low priority', () => {
    const result = parseTaskText('Sort old files low', noKids);
    expect(result.priority).toBe('low');
  });

  it('infers shopping category from "groceries"', () => {
    const result = parseTaskText('Buy groceries', noKids);
    expect(result.category).toBe('shopping');
  });

  it('infers health category from "gym"', () => {
    const result = parseTaskText('Go to gym', noKids);
    expect(result.category).toBe('health');
  });

  it('infers work category from "meeting"', () => {
    const result = parseTaskText('Prepare for meeting', noKids);
    expect(result.category).toBe('work');
  });

  it('assigns to a kid when "for Alice" is in text', () => {
    const result = parseTaskText('Do homework for Alice', kids);
    expect(result.assignees).toContain('kid-1');
    expect(result.assignees).not.toContain('me');
  });

  it('assigns to all kids when "all kids" is in text', () => {
    const result = parseTaskText('Clean room for all kids', kids);
    expect(result.assignees).toContain('kid-1');
    expect(result.assignees).toContain('kid-2');
  });

  it('defaults to me when no kid is mentioned', () => {
    const result = parseTaskText('Cook dinner', kids);
    expect(result.assignees).toEqual(['me']);
  });

  it('falls back to original text as title when everything is extracted', () => {
    const result = parseTaskText('today', noKids);
    // After removing "today", remaining is empty → falls back to original text
    expect(result.title).toBeTruthy();
  });

  it('is case-insensitive for keywords', () => {
    const result = parseTaskText('Fix URGENT bug TODAY', noKids);
    expect(result.priority).toBe('high');
    expect(result.dueDate).toBe('2026-06-15');
  });
});

// ── findTaskByTitle ───────────────────────────────────────────────────────────

describe('findTaskByTitle', () => {
  const tasks: Task[] = [
    createTask({ id: 't1', title: 'Buy milk', completed_at: null }),
    createTask({ id: 't2', title: 'Pick up kids from school', completed_at: null }),
    createTask({ id: 't3', title: 'Pay electricity bill', completed_at: null }),
    createTask({ id: 't4', title: 'Completed task', completed_at: '2026-06-10T00:00:00Z' }),
  ];

  it('returns null for empty query', () => {
    expect(findTaskByTitle('', tasks)).toBeNull();
  });

  it('finds exact match', () => {
    expect(findTaskByTitle('Buy milk', tasks)?.id).toBe('t1');
  });

  it('is case-insensitive for exact match', () => {
    expect(findTaskByTitle('buy milk', tasks)?.id).toBe('t1');
  });

  it('finds by partial contains match', () => {
    expect(findTaskByTitle('electricity', tasks)?.id).toBe('t3');
  });

  it('finds by word scoring', () => {
    expect(findTaskByTitle('pick up kids', tasks)?.id).toBe('t2');
  });

  it('ignores completed tasks', () => {
    expect(findTaskByTitle('Completed task', tasks)).toBeNull();
  });

  it('returns null when no match found', () => {
    expect(findTaskByTitle('xyzzy no match', tasks)).toBeNull();
  });
});
