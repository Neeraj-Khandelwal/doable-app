export type TaskPriority = 'high' | 'medium' | 'low';
export type AssignmentStatus = 'pending_acceptance' | 'accepted' | 'rejected';
export type TaskCategory = 'home' | 'work' | 'health' | 'shopping' | 'kids' | 'school' | 'finance' | 'other';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';
export type ReminderType = 'notification' | 'alarm' | 'nudge';
export type NudgeInterval = 5 | 10 | 15 | 30 | 60;
export type RatingType = string; // extensible — custom ratings stored per family

export interface RatingOption {
  type: string;
  emoji: string;
  points: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskRating {
  kid_id: string;
  rating_type: RatingType;
  points: number;
  timestamp: string;
}

export interface Task {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description: string | null;
  assignees: string[]; // ['me'] or array of kid_ids
  due_date: string | null; // ISO date YYYY-MM-DD
  reminder_time: string | null; // HH:MM 24h
  reminder_type: ReminderType | null;
  nudge_interval: NudgeInterval | null;
  priority: TaskPriority;
  category: TaskCategory;
  recurrence: TaskRecurrence;
  completed_by: string | null;
  completed_at: string | null;
  ratings: TaskRating[];
  subtasks: Subtask[];
  is_overdue: boolean;
  // Phase 14: assignment workflow
  assigned_to_user_id: string | null;
  assignment_status: AssignmentStatus;
  rejection_reason: string | null;
  responded_at: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export const TASK_PRIORITIES: Record<string, TaskPriority> = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const TASK_CATEGORIES: Record<string, TaskCategory> = {
  HOME: 'home',
  WORK: 'work',
  HEALTH: 'health',
  SHOPPING: 'shopping',
  KIDS: 'kids',
  SCHOOL: 'school',
  FINANCE: 'finance',
  OTHER: 'other',
};

export const TASK_RECURRENCE: Record<string, TaskRecurrence> = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export const REMINDER_TYPES: Record<string, ReminderType> = {
  NOTIFICATION: 'notification',
  ALARM: 'alarm',
  NUDGE: 'nudge',
};

export const NUDGE_INTERVALS: NudgeInterval[] = [5, 10, 15, 30, 60];

export const DEFAULT_RATING_OPTIONS: RatingOption[] = [
  { type: 'Awesome', emoji: '🌟', points: 5 },
  { type: 'Good', emoji: '👍', points: 3 },
  { type: 'Ok Ok', emoji: '😐', points: 1 },
  { type: 'Very Bad', emoji: '👎', points: -2 },
];

// Backward-compat alias kept so existing imports don't break
export const RATING_OPTIONS = DEFAULT_RATING_OPTIONS;

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  home: 'Home',
  work: 'Work',
  health: 'Health',
  shopping: 'Shopping',
  kids: 'Kids',
  school: 'School',
  finance: 'Finance',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<TaskCategory, string> = {
  home: '🏠',
  work: '💼',
  health: '💪',
  shopping: '🛒',
  kids: '🧒',
  school: '📚',
  finance: '💰',
  other: '📌',
};

export function createTask(data: Partial<Task>): Task {
  const now = new Date().toISOString();
  return {
    id: data.id ?? '',
    family_id: data.family_id ?? '',
    created_by: data.created_by ?? '',
    title: data.title ?? '',
    description: data.description ?? null,
    assignees: data.assignees ?? [],
    due_date: data.due_date ?? null,
    reminder_time: data.reminder_time ?? null,
    reminder_type: data.reminder_type ?? null,
    nudge_interval: data.nudge_interval ?? null,
    priority: data.priority ?? 'medium',
    category: data.category ?? 'other',
    recurrence: data.recurrence ?? 'none',
    completed_by: data.completed_by ?? null,
    completed_at: data.completed_at ?? null,
    ratings: data.ratings ?? [],
    subtasks: data.subtasks ?? [],
    is_overdue: data.is_overdue ?? false,
    assigned_to_user_id: data.assigned_to_user_id ?? null,
    assignment_status: data.assignment_status ?? 'accepted',
    rejection_reason: data.rejection_reason ?? null,
    responded_at: data.responded_at ?? null,
    is_private: data.is_private ?? false,
    created_at: data.created_at ?? now,
    updated_at: data.updated_at ?? now,
  };
}

export function isTaskOverdue(task: Task): boolean {
  if (task.completed_at) return false;
  if (!task.due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function isKidTask(task: Task): boolean {
  return task.assignees.some((a) => a !== 'me');
}

export function getNextDueDate(dueDate: string, recurrence: TaskRecurrence): string | null {
  if (recurrence === 'none') return null;
  const d = new Date(dueDate);
  if (recurrence === 'daily') d.setDate(d.getDate() + 1);
  else if (recurrence === 'weekly') d.setDate(d.getDate() + 7);
  else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}
