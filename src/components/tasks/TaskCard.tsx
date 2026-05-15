import type { Task, TaskPriority } from '../../utils/taskModels';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../../utils/taskModels';
import type { KidProfile } from '../../utils/familyModels';

interface TaskCardProps {
  task: Task;
  kids: KidProfile[];
  currentUserId?: string;
  onComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onReassign?: (task: Task) => void;
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

export default function TaskCard({ task, kids, currentUserId, onComplete, onEdit, onDelete, onReassign }: TaskCardProps) {
  const priority = PRIORITY_STYLES[task.priority];
  const due = formatDueDate(task.due_date, task.is_overdue);
  const done = !!task.completed_at;

  const isPrivate = task.is_private && !task.assigned_to_user_id;
  const isPending = task.assignment_status === 'pending_acceptance';
  const isRejected = task.assignment_status === 'rejected';
  const isCreator = task.created_by === currentUserId;

  const assigneeLabels = task.assignees.map((a) => {
    if (a === 'me') return { label: 'Me', color: '#7C6FF0' };
    const kid = kids.find((k) => k.id === a);
    return { label: kid?.name ?? 'Kid', color: KID_COLOR_MAP[kid?.color ?? 'lavender'] };
  });

  const borderColor = isRejected ? '#E85450' : isPending ? '#E8A800' : done ? '#d1d5db' : '#7C6FF0';

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-opacity ${done ? 'opacity-60' : ''}`}
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox — hidden for pending/rejected */}
        {!isPending && !isRejected && (
          <button
            onClick={() => !done && onComplete(task)}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              done ? 'bg-mint border-mint' : 'border-gray-300 hover:border-lavender'
            }`}
            aria-label={done ? 'Completed' : 'Mark complete'}
          >
            {done && <span className="text-white text-xs">✓</span>}
          </button>
        )}

        {/* Pending/rejected placeholder spacing */}
        {(isPending || isRejected) && <div className="w-5 flex-shrink-0" />}

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => !done && !isPending && onEdit(task)} role="button" tabIndex={0}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isPrivate && <span className="text-xs" title="Private">🔒</span>}
            <p className={`font-semibold text-gray-900 text-sm leading-snug ${done ? 'line-through text-gray-400' : ''}`}>
              {task.title}
            </p>
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
          )}

          {/* Status banners */}
          {isPending && isCreator && (
            <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-amber/10 rounded-lg">
              <span className="text-xs">🕐</span>
              <span className="text-xs font-medium text-amber">Awaiting acceptance</span>
            </div>
          )}

          {isRejected && isCreator && (
            <div className="mt-2 px-2 py-1.5 bg-rose/10 rounded-lg">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">✕</span>
                <span className="text-xs font-medium text-rose">Task rejected</span>
              </div>
              {task.rejection_reason && (
                <p className="text-xs text-gray-500 mt-0.5">"{task.rejection_reason}"</p>
              )}
              <div className="flex gap-2 mt-2">
                {onReassign && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onReassign(task); }}
                    className="text-xs font-semibold text-lavender px-2 py-1 bg-lavender/10 rounded-lg"
                  >
                    Reassign
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                  className="text-xs font-semibold text-rose px-2 py-1 bg-rose/10 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Assignee badges */}
          {!isRejected && (
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
              {task.assigned_to_user_id && task.assigned_to_user_id !== currentUserId && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white bg-sky-400">
                  → Partner
                </span>
              )}
            </div>
          )}

          {/* Subtask progress */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ink-3">
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-lavender rounded-full transition-all"
                  style={{ width: `${(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Meta row */}
          {!isRejected && (
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
          )}
        </div>

        {/* Delete button — only for non-rejected, non-pending creator tasks */}
        {!done && !isPending && !isRejected && (
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
