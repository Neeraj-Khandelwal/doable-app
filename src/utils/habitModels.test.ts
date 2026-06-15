import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  localDateStr,
  parseLocalDate,
  isScheduledForDay,
  isScheduledToday,
  computeStreak,
} from './habitModels';
import type { Habit, HabitCompletion } from './habitModels';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    family_id: 'fam-1',
    created_by: 'user-1',
    title: 'Test habit',
    description: null,
    assignees: ['me'],
    category: 'health',
    frequency: 'daily',
    frequency_days: null,
    target_count: 1,
    icon: '✅',
    reminder_time: null,
    reminder_times: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeCompletion(habitId: string, assignee: string, date: string): HabitCompletion {
  return {
    id: `comp-${date}`,
    habit_id: habitId,
    family_id: 'fam-1',
    completed_by: assignee,
    date,
    created_at: `${date}T09:00:00Z`,
  };
}

// ── localDateStr ──────────────────────────────────────────────────────────────

describe('localDateStr', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(localDateStr(new Date(2026, 5, 15))).toBe('2026-06-15'); // month is 0-indexed
  });

  it('zero-pads month and day', () => {
    expect(localDateStr(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

// ── parseLocalDate ────────────────────────────────────────────────────────────

describe('parseLocalDate', () => {
  it('round-trips with localDateStr', () => {
    const original = '2026-06-15';
    expect(localDateStr(parseLocalDate(original))).toBe(original);
  });

  it('parses as local midnight (not UTC)', () => {
    const d = parseLocalDate('2026-06-15');
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});

// ── isScheduledForDay ─────────────────────────────────────────────────────────

describe('isScheduledForDay', () => {
  it('daily habit is scheduled every day', () => {
    const habit = makeHabit({ frequency: 'daily' });
    [0, 1, 2, 3, 4, 5, 6].forEach(day => {
      expect(isScheduledForDay(habit, day)).toBe(true);
    });
  });

  it('weekdays habit fires Mon–Fri only', () => {
    const habit = makeHabit({ frequency: 'weekdays' });
    expect(isScheduledForDay(habit, 0)).toBe(false); // Sun
    expect(isScheduledForDay(habit, 1)).toBe(true);  // Mon
    expect(isScheduledForDay(habit, 5)).toBe(true);  // Fri
    expect(isScheduledForDay(habit, 6)).toBe(false); // Sat
  });

  it('weekends habit fires Sat and Sun only', () => {
    const habit = makeHabit({ frequency: 'weekends' });
    expect(isScheduledForDay(habit, 0)).toBe(true);  // Sun
    expect(isScheduledForDay(habit, 3)).toBe(false); // Wed
    expect(isScheduledForDay(habit, 6)).toBe(true);  // Sat
  });

  it('custom habit fires only on specified days', () => {
    const habit = makeHabit({ frequency: 'custom', frequency_days: [1, 3, 5] }); // Mon, Wed, Fri
    expect(isScheduledForDay(habit, 1)).toBe(true);
    expect(isScheduledForDay(habit, 3)).toBe(true);
    expect(isScheduledForDay(habit, 5)).toBe(true);
    expect(isScheduledForDay(habit, 0)).toBe(false);
    expect(isScheduledForDay(habit, 2)).toBe(false);
  });

  it('custom habit with null frequency_days returns false', () => {
    const habit = makeHabit({ frequency: 'custom', frequency_days: null });
    expect(isScheduledForDay(habit, 1)).toBe(false);
  });
});

// ── isScheduledToday ──────────────────────────────────────────────────────────

describe('isScheduledToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00')); // Monday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('daily habit is always scheduled today', () => {
    expect(isScheduledToday(makeHabit({ frequency: 'daily' }))).toBe(true);
  });

  it('weekdays habit is scheduled on Monday', () => {
    expect(isScheduledToday(makeHabit({ frequency: 'weekdays' }))).toBe(true);
  });

  it('weekends habit is not scheduled on Monday', () => {
    expect(isScheduledToday(makeHabit({ frequency: 'weekends' }))).toBe(false);
  });
});

// ── computeStreak ─────────────────────────────────────────────────────────────

describe('computeStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set to a Monday (2026-06-15)
    vi.setSystemTime(new Date('2026-06-15T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 with no completions', () => {
    const habit = makeHabit({ frequency: 'daily' });
    expect(computeStreak([], 'me', habit)).toBe(0);
  });

  it('returns 1 for single completion today', () => {
    const habit = makeHabit({ frequency: 'daily' });
    const completions = [makeCompletion('habit-1', 'me', '2026-06-15')];
    expect(computeStreak(completions, 'me', habit)).toBe(1);
  });

  it('counts consecutive days correctly', () => {
    const habit = makeHabit({ frequency: 'daily' });
    const completions = [
      makeCompletion('habit-1', 'me', '2026-06-15'),
      makeCompletion('habit-1', 'me', '2026-06-14'),
      makeCompletion('habit-1', 'me', '2026-06-13'),
    ];
    expect(computeStreak(completions, 'me', habit)).toBe(3);
  });

  it('breaks streak on a missed day', () => {
    const habit = makeHabit({ frequency: 'daily' });
    const completions = [
      makeCompletion('habit-1', 'me', '2026-06-15'),
      makeCompletion('habit-1', 'me', '2026-06-14'),
      // gap on 2026-06-13
      makeCompletion('habit-1', 'me', '2026-06-12'),
    ];
    expect(computeStreak(completions, 'me', habit)).toBe(2);
  });

  it('ignores completions by a different assignee', () => {
    const habit = makeHabit({ frequency: 'daily' });
    const completions = [
      makeCompletion('habit-1', 'kid-999', '2026-06-15'),
      makeCompletion('habit-1', 'kid-999', '2026-06-14'),
    ];
    expect(computeStreak(completions, 'me', habit)).toBe(0);
  });

  it('ignores completions from a different habit', () => {
    const habit = makeHabit({ frequency: 'daily' });
    const completions = [
      makeCompletion('habit-OTHER', 'me', '2026-06-15'),
    ];
    expect(computeStreak(completions, 'me', habit)).toBe(0);
  });

  it('skips non-scheduled days for weekdays habit', () => {
    // 2026-06-15 is Monday — look back over the weekend
    const habit = makeHabit({ frequency: 'weekdays' });
    const completions = [
      makeCompletion('habit-1', 'me', '2026-06-15'), // Mon
      makeCompletion('habit-1', 'me', '2026-06-12'), // Fri (skips Sat+Sun)
      makeCompletion('habit-1', 'me', '2026-06-11'), // Thu
    ];
    expect(computeStreak(completions, 'me', habit)).toBe(3);
  });
});
