import type { TaskCategory, TaskPriority, TaskRecurrence } from './taskModels';

export interface TaskTemplate {
  label: string;
  emoji: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  recurrence: TaskRecurrence;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  { label: 'School pickup',  emoji: '🚗', title: 'Pick up kids from school', category: 'kids',     priority: 'high',   recurrence: 'daily'   },
  { label: 'Grocery run',    emoji: '🛒', title: 'Do grocery shopping',      category: 'shopping', priority: 'medium', recurrence: 'weekly'  },
  { label: 'Pay bills',      emoji: '💰', title: 'Pay monthly bills',         category: 'finance',  priority: 'high',   recurrence: 'monthly' },
  { label: 'Clean house',    emoji: '🧹', title: 'Clean the house',           category: 'home',     priority: 'medium', recurrence: 'weekly'  },
  { label: 'Doctor appt',    emoji: '🏥', title: 'Doctor appointment',        category: 'health',   priority: 'high',   recurrence: 'none'    },
  { label: 'Homework',       emoji: '📚', title: 'Do homework',               category: 'school',   priority: 'medium', recurrence: 'daily'   },
  { label: 'Exercise',       emoji: '💪', title: 'Workout / exercise',        category: 'health',   priority: 'medium', recurrence: 'daily'   },
  { label: 'Team standup',   emoji: '💼', title: 'Team standup meeting',      category: 'work',     priority: 'medium', recurrence: 'daily'   },
  { label: 'Cook dinner',    emoji: '🍳', title: 'Cook dinner',               category: 'home',     priority: 'medium', recurrence: 'daily'   },
  { label: 'Budget review',  emoji: '📊', title: 'Review monthly budget',     category: 'finance',  priority: 'medium', recurrence: 'monthly' },
];
