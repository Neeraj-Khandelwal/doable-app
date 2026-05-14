export type HabitCategory = 'health' | 'fitness' | 'learning' | 'mindfulness' | 'chores' | 'social' | 'other';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface Habit {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description: string | null;
  assignees: string[]; // ['me'] or kid ids
  category: HabitCategory;
  frequency: HabitFrequency;
  frequency_days: number[] | null; // [0..6] Sun=0, for custom frequency
  target_count: number; // times to complete per scheduled day
  icon: string; // emoji
  reminder_time: string | null; // HH:MM
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  family_id: string;
  completed_by: string; // 'me' or kid_id
  date: string; // YYYY-MM-DD
  created_at: string;
}


export const HABIT_CATEGORIES: Record<string, HabitCategory> = {
  HEALTH: 'health',
  FITNESS: 'fitness',
  LEARNING: 'learning',
  MINDFULNESS: 'mindfulness',
  CHORES: 'chores',
  SOCIAL: 'social',
  OTHER: 'other',
};

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  health: 'Health',
  fitness: 'Fitness',
  learning: 'Learning',
  mindfulness: 'Mindful',
  chores: 'Chores',
  social: 'Social',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<HabitCategory, string> = {
  health: '🥗',
  fitness: '💪',
  learning: '📚',
  mindfulness: '🧘',
  chores: '🏠',
  social: '💬',
  other: '⭐',
};

export const HABIT_ICONS = [
  '✅', '💪', '🥗', '📚', '🧘', '🏃', '💧', '🎵',
  '🎨', '🌿', '☀️', '🌙', '🎯', '🏆', '❤️', '🧹',
  '🍎', '😴', '🚴', '🧠', '✍️', '🌸', '🦷', '🐕',
];

export const FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: 'Every day',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  custom: 'Custom',
};

export const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function isScheduledForDay(habit: Habit, day: number): boolean {
  switch (habit.frequency) {
    case 'daily': return true;
    case 'weekdays': return day >= 1 && day <= 5;
    case 'weekends': return day === 0 || day === 6;
    case 'custom': return habit.frequency_days?.includes(day) ?? false;
    default: return true;
  }
}

export function isScheduledToday(habit: Habit): boolean {
  return isScheduledForDay(habit, new Date().getDay());
}

// Computes streak for a specific assignee on a habit.
// Streak = consecutive scheduled days (going back from today) with at least one completion.
// If today is not yet completed, the streak reflects past completed days.
export function computeStreak(completions: HabitCompletion[], assignee: string, habit: Habit): number {
  const completedDates = new Set(
    completions
      .filter((c) => c.completed_by === assignee && c.habit_id === habit.id)
      .map((c) => c.date)
  );

  const today = todayStr();
  const todayCompleted = completedDates.has(today);

  const current = new Date();
  current.setHours(0, 0, 0, 0);

  if (!todayCompleted) {
    current.setDate(current.getDate() - 1);
  }

  let streak = 0;

  for (let i = 0; i < 90; i++) {
    const dateStr = current.toISOString().split('T')[0];

    if (isScheduledForDay(habit, current.getDay())) {
      if (completedDates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    current.setDate(current.getDate() - 1);
  }

  return streak;
}
