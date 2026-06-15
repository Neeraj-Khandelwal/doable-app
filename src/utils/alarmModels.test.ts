import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRepeatDays, alarmFiresToday } from './alarmModels';
import type { Alarm, RepeatDay } from './alarmModels';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAlarm(overrides: Partial<Alarm> = {}): Alarm {
  return {
    id: 'alarm-1',
    user_id: 'user-1',
    family_id: null,
    time: '07:30',
    label: 'Wake up',
    enabled: true,
    repeat_days: [],
    sound: 'default',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── formatRepeatDays ──────────────────────────────────────────────────────────

describe('formatRepeatDays', () => {
  it('returns "Once" for empty days', () => {
    expect(formatRepeatDays([])).toBe('Once');
  });

  it('returns "Every day" for all 7 days', () => {
    expect(formatRepeatDays([0, 1, 2, 3, 4, 5, 6])).toBe('Every day');
  });

  it('returns "Weekdays" for Mon–Fri', () => {
    expect(formatRepeatDays([1, 2, 3, 4, 5])).toBe('Weekdays');
  });

  it('returns "Weekends" for Sat+Sun', () => {
    expect(formatRepeatDays([0, 6])).toBe('Weekends');
  });

  it('returns sorted abbreviated day labels for custom selection', () => {
    expect(formatRepeatDays([1, 3, 5] as RepeatDay[])).toBe('Mo, We, Fr');
  });

  it('sorts days regardless of input order', () => {
    expect(formatRepeatDays([5, 1, 3] as RepeatDay[])).toBe('Mo, We, Fr');
  });

  it('returns single day label', () => {
    expect(formatRepeatDays([1])).toBe('Mo');
  });
});

// ── alarmFiresToday ───────────────────────────────────────────────────────────

describe('alarmFiresToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00')); // Monday = day 1
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when alarm is disabled', () => {
    const alarm = makeAlarm({ enabled: false, repeat_days: [1] });
    expect(alarmFiresToday(alarm)).toBe(false);
  });

  it('returns true for one-time alarm (empty repeat_days)', () => {
    const alarm = makeAlarm({ enabled: true, repeat_days: [] });
    expect(alarmFiresToday(alarm)).toBe(true);
  });

  it('returns true when today (Monday) is in repeat_days', () => {
    const alarm = makeAlarm({ enabled: true, repeat_days: [1] }); // Monday
    expect(alarmFiresToday(alarm)).toBe(true);
  });

  it('returns false when today is not in repeat_days', () => {
    const alarm = makeAlarm({ enabled: true, repeat_days: [0, 6] }); // Weekends only
    expect(alarmFiresToday(alarm)).toBe(false);
  });

  it('returns true for every-day alarm', () => {
    const alarm = makeAlarm({ enabled: true, repeat_days: [0, 1, 2, 3, 4, 5, 6] });
    expect(alarmFiresToday(alarm)).toBe(true);
  });
});
