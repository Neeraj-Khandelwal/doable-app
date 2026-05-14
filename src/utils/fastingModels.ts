export interface FastSession {
  id: string;
  user_id: string;
  family_id: string | null;
  start_time: string;       // ISO timestamp
  end_time: string | null;  // null = active
  goal_minutes: number;
  created_at: string;
}

export interface FastingGoal {
  user_id: string;
  goal_hours: number;
  updated_at: string;
}

export interface FastingStage {
  hours: number;
  name: string;
  emoji: string;
  message: string;
}

export const FASTING_STAGES: FastingStage[] = [
  { hours: 0,  name: 'Fed State',        emoji: '🍽️', message: "Every journey starts with a single step. You've got this!" },
  { hours: 4,  name: 'Glycogen Burning', emoji: '⚡',  message: 'Great start! Your body is burning through stored sugars.' },
  { hours: 8,  name: 'Fat Burning',      emoji: '🔥',  message: "You're in the zone! Fat burning has begun." },
  { hours: 12, name: 'Deep Fat Burning', emoji: '💪',  message: 'Over halfway! Your body is deep in fat-burning mode.' },
  { hours: 16, name: 'Autophagy',        emoji: '✨',  message: 'Goal reached! Cellular cleanup (autophagy) is kicking in.' },
  { hours: 20, name: 'Deep Fasting',     emoji: '🏆',  message: "Elite mode! You're in a deep fasting state." },
];

export const DEFAULT_GOAL_HOURS = 16;

export const GOAL_PRESETS = [12, 14, 16, 18, 20, 23];

export function getCurrentStage(elapsedMinutes: number): FastingStage {
  const elapsedHours = elapsedMinutes / 60;
  let current = FASTING_STAGES[0];
  for (const stage of FASTING_STAGES) {
    if (elapsedHours >= stage.hours) current = stage;
    else break;
  }
  return current;
}

export function getProgressPercent(elapsedMinutes: number, goalMinutes: number): number {
  if (goalMinutes <= 0) return 0;
  return Math.min(100, Math.round((elapsedMinutes / goalMinutes) * 100));
}

export function formatElapsedHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function sessionDurationMinutes(session: FastSession): number {
  const end = session.end_time ? new Date(session.end_time) : new Date();
  return Math.max(0, Math.floor((end.getTime() - new Date(session.start_time).getTime()) / 60000));
}
