import type { Task, TaskPriority } from '../../utils/taskModels';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../../utils/taskModels';
import type { KidProfile } from '../../utils/familyModels';

interface TaskCardProps {
  task: Task;
  kids: KidProfile[];
  onComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_STYLES: Record<TaskPriority, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-rose/15', text: 'text-rose', label: 'High' },
  medium: { bg: 'bg-amber/15', text: 'text-amber', label: 'Med' },
  low: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Low' },
};

const KID_COLOR_MAP: Record<string, string> = {
  lavender: '#b39ddb',
  peach: '#ffab91',
  mint: '#80cbc4',
  sky: '#81d4fa',
  amber: '#ffd54f',
  rose: '#f48fb1',
};

function formatDueDate(due: string | null, overdue: boolean): { label: string; className: string } {
  if (!due) return { label: '', className: '' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);

  let label = '';
  if (diff === 0) label = 'Today';
  else if (diff === 1) label = 'Tomorrow';
  else if (diff === -1) label = 'Yesterday';
  else if (overdue) label = `${Math.abs(diff)}d overdue`;
  else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    label,
    className: overdue ? 'text-rose font-semibold' : diff === 0 ? 'text-amber font-semibold' : 'text-gray-500',
  };
}

export default function TaskCard({ task, kids, onComplete, onEdit, onDelete }: TaskCardProps) {
  const priority = PRIORITY_STYLES[task.priority];
  const due = formatDueDate(task.due_date, task.is_overdue);
  const done = !!task.completed_at;

  const assigneeLabels = task.assignees.map((a) => {
    if (a === 'me') return { label: 'Me', color: '#7C6FF0' };
    const kid = kids.find((k) => k.id === a);
    return { label: kid?.name ?? 'Kid', color: KID_COLOR_MAP[kid?.color ?? 'lavender'] };
  });

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-opacity ${done ? 'opacity-60' : ''}`}
      style={{ borderLeft: `4px solid ${done ? '#d1d5db' : '#7C6FF0'}` }}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox */}
        <button
          onClick={() => !done && onComplete(task)}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            done ? 'bg-mint border-mint' : 'border-gray-300 hover:border-lavender'
          }`}
          aria-label={done ? 'Completed' : 'Mark complete'}
        >
          {done && <span className="text-white text-xs">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => !done && onEdit(task)} role="button" tabIndex={0}>
          <p className={`font-semibold text-gray-900 text-sm leading-snug ${done ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
          )}

          {/* Assignee badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            {assigneeLabels.map((a, i) => (
              <span
                key={i}
                className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: a.color }}
              >
                {a.label}
              </span>
            ))}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {due.label && (
              <span className={`text-xs flex items-center gap-1 ${due.className}`}>
                📅 {due.label}
              </span>
            )}

            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}>
              {priority.label}
            </span>

            <span className="text-xs text-gray-400">
              {CATEGORY_ICONS[task.category]} {CATEGORY_LABELS[task.category]}
            </span>

            {task.recurrence !== 'none' && (
              <span className="text-xs text-sky">🔁 {task.recurrence}</span>
            )}
          </div>
        </div>

        {/* Delete button */}
        {!done && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="text-gray-300 hover:text-rose transition-colors flex-shrink-0 text-lg leading-none"
            aria-label="Delete task"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
