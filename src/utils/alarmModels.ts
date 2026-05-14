export type RepeatDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun, 1=Mon, ... 6=Sat
export type AlarmSound = 'default' | 'silent' | 'bell' | 'chime';

export interface Alarm {
  id: string;
  user_id: string;
  family_id: string | null;
  time: string; // HH:MM 24h
  label: string | null;
  enabled: boolean;
  repeat_days: RepeatDay[]; // empty = one-time
  sound: AlarmSound;
  created_at: string;
  updated_at: string;
}

export const DAY_LABELS: Record<RepeatDay, string> = {
  0: 'Su',
  1: 'Mo',
  2: 'Tu',
  3: 'We',
  4: 'Th',
  5: 'Fr',
  6: 'Sa',
};

export const ALL_DAYS: RepeatDay[] = [0, 1, 2, 3, 4, 5, 6];

export function formatRepeatDays(days: RepeatDay[]): string {
  if (days.length === 0) return 'Once';
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return 'Weekdays';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(', ');
}

export function alarmFiresToday(alarm: Alarm): boolean {
  if (!alarm.enabled) return false;
  if (alarm.repeat_days.length === 0) return true; // one-time, assume today
  return alarm.repeat_days.includes(new Date().getDay() as RepeatDay);
}
