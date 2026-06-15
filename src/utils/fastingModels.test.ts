import { describe, it, expect } from 'vitest';
import {
  getCurrentStage,
  getProgressPercent,
  formatElapsedHMS,
  sessionDurationMinutes,
  FASTING_STAGES,
} from './fastingModels';
import type { FastSession } from './fastingModels';

// ── getCurrentStage ───────────────────────────────────────────────────────────

describe('getCurrentStage', () => {
  it('returns Fed State at 0 minutes', () => {
    expect(getCurrentStage(0).name).toBe('Fed State');
  });

  it('returns Glycogen Burning at 4 hours (240 min)', () => {
    expect(getCurrentStage(240).name).toBe('Glycogen Burning');
  });

  it('returns Fat Burning at 8 hours (480 min)', () => {
    expect(getCurrentStage(480).name).toBe('Fat Burning');
  });

  it('returns Deep Fat Burning at 12 hours (720 min)', () => {
    expect(getCurrentStage(720).name).toBe('Deep Fat Burning');
  });

  it('returns Autophagy at 16 hours (960 min)', () => {
    expect(getCurrentStage(960).name).toBe('Autophagy');
  });

  it('returns Deep Fasting at 20 hours (1200 min)', () => {
    expect(getCurrentStage(1200).name).toBe('Deep Fasting');
  });

  it('stays at highest stage beyond 20 hours', () => {
    expect(getCurrentStage(2000).name).toBe('Deep Fasting');
  });

  it('returns correct stage at boundary (just under 4 hours)', () => {
    expect(getCurrentStage(239).name).toBe('Fed State');
  });

  it('covers all 6 stages', () => {
    expect(FASTING_STAGES).toHaveLength(6);
  });
});

// ── getProgressPercent ────────────────────────────────────────────────────────

describe('getProgressPercent', () => {
  it('returns 0 for 0 elapsed', () => {
    expect(getProgressPercent(0, 960)).toBe(0);
  });

  it('returns 50 at halfway', () => {
    expect(getProgressPercent(480, 960)).toBe(50);
  });

  it('returns 100 at goal', () => {
    expect(getProgressPercent(960, 960)).toBe(100);
  });

  it('caps at 100 when elapsed exceeds goal', () => {
    expect(getProgressPercent(1200, 960)).toBe(100);
  });

  it('returns 0 when goalMinutes is 0', () => {
    expect(getProgressPercent(100, 0)).toBe(0);
  });

  it('returns 0 when goalMinutes is negative', () => {
    expect(getProgressPercent(100, -1)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    // 100/960 = 10.41... → rounds to 10
    expect(getProgressPercent(100, 960)).toBe(10);
  });
});

// ── formatElapsedHMS ──────────────────────────────────────────────────────────

describe('formatElapsedHMS', () => {
  it('formats 0 as 00:00:00', () => {
    expect(formatElapsedHMS(0)).toBe('00:00:00');
  });

  it('formats 1 hour correctly', () => {
    expect(formatElapsedHMS(3600)).toBe('01:00:00');
  });

  it('formats mixed hours, minutes, seconds', () => {
    expect(formatElapsedHMS(3723)).toBe('01:02:03'); // 1h 2m 3s
  });

  it('zero-pads single digit values', () => {
    expect(formatElapsedHMS(61)).toBe('00:01:01'); // 1m 1s
  });

  it('handles large values', () => {
    expect(formatElapsedHMS(86400)).toBe('24:00:00'); // 24 hours
  });
});

// ── sessionDurationMinutes ────────────────────────────────────────────────────

describe('sessionDurationMinutes', () => {
  it('calculates duration for a completed session', () => {
    const session: FastSession = {
      id: 's1',
      user_id: 'u1',
      family_id: null,
      start_time: '2026-06-15T08:00:00Z',
      end_time: '2026-06-15T16:00:00Z', // 8 hours
      goal_minutes: 960,
      created_at: '2026-06-15T08:00:00Z',
    };
    expect(sessionDurationMinutes(session)).toBe(480);
  });

  it('returns 0 for a session that starts and ends at the same time', () => {
    const session: FastSession = {
      id: 's1',
      user_id: 'u1',
      family_id: null,
      start_time: '2026-06-15T08:00:00Z',
      end_time: '2026-06-15T08:00:00Z',
      goal_minutes: 960,
      created_at: '2026-06-15T08:00:00Z',
    };
    expect(sessionDurationMinutes(session)).toBe(0);
  });
});
