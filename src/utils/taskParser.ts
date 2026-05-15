import type { TaskPriority, TaskCategory } from './taskModels';
import type { KidProfile } from './familyModels';

export interface ParsedTask {
  title: string;
  dueDate: string | null;
  assignees: string[];
  priority: TaskPriority;
  category: TaskCategory;
}

const DATE_KEYWORDS: Record<string, () => string> = {
  today: () => new Date().toISOString().split('T')[0],
  tomorrow: () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; },
  'next week': () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; },
  'next month': () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; },
  'this week': () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; },
};

const PRIORITY_KEYWORDS: Record<string, TaskPriority> = {
  urgent: 'high',
  'high priority': 'high',
  important: 'high',
  asap: 'high',
  low: 'low',
  'low priority': 'low',
  whenever: 'low',
};

const CATEGORY_KEYWORDS: Record<string, TaskCategory> = {
  groceries: 'shopping',
  grocery: 'shopping',
  buy: 'shopping',
  shop: 'shopping',
  purchase: 'shopping',
  work: 'work',
  office: 'work',
  meeting: 'work',
  school: 'school',
  homework: 'school',
  study: 'school',
  exercise: 'health',
  gym: 'health',
  doctor: 'health',
  health: 'health',
  medicine: 'health',
  clean: 'home',
  wash: 'home',
  cook: 'home',
  home: 'home',
  kids: 'kids',
  finance: 'finance',
  bank: 'finance',
  pay: 'finance',
  bill: 'finance',
};

export function parseTaskText(text: string, kids: KidProfile[]): ParsedTask {
  let remaining = text.trim();
  let dueDate: string | null = null;
  let priority: TaskPriority = 'medium';
  let category: TaskCategory = 'other';
  const assignees: string[] = [];

  // Extract date keywords (multi-word first)
  const sortedDateKeys = Object.keys(DATE_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const keyword of sortedDateKeys) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(remaining)) {
      dueDate = DATE_KEYWORDS[keyword]();
      remaining = remaining.replace(regex, '').trim();
      break;
    }
  }

  // Extract priority keywords (multi-word first)
  const sortedPriorityKeys = Object.keys(PRIORITY_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const keyword of sortedPriorityKeys) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(remaining)) {
      priority = PRIORITY_KEYWORDS[keyword];
      remaining = remaining.replace(regex, '').trim();
      break;
    }
  }

  // Extract kid names — check "for [kid]", "for [kid] and [kid]", or standalone names
  const lowerRemaining = remaining.toLowerCase();
  for (const kid of kids) {
    const kidName = kid.name.toLowerCase();
    const forPattern = new RegExp(`\\bfor\\s+${kidName}\\b`, 'i');
    const standalonePattern = new RegExp(`\\b${kidName}\\b`, 'i');
    if (forPattern.test(remaining)) {
      assignees.push(kid.id);
      remaining = remaining.replace(forPattern, '').trim();
    } else if (standalonePattern.test(remaining)) {
      assignees.push(kid.id);
      remaining = remaining.replace(standalonePattern, '').trim();
    }
  }

  // "all kids" pattern
  if (/\ball kids?\b/i.test(remaining)) {
    kids.forEach((k) => { if (!assignees.includes(k.id)) assignees.push(k.id); });
    remaining = remaining.replace(/\ball kids?\b/i, '').trim();
  }

  // Default to 'me' if no assignees found
  if (assignees.length === 0) assignees.push('me');

  // Infer category from keywords
  for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lowerRemaining.includes(keyword)) {
      category = cat;
      break;
    }
  }

  // Clean up leftover connectors ("and", "for", punctuation)
  const title = remaining
    .replace(/\s+/g, ' ')
    .replace(/^(and|for|,)\s+/i, '')
    .replace(/\s+(and|for|,)$/i, '')
    .trim() || text.trim();

  return { title, dueDate, assignees, priority, category };
}
