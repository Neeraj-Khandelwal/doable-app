import { useState, useEffect } from 'react';
import type { Task, TaskCategory, TaskPriority, TaskRecurrence, ReminderType, NudgeInterval } from '../../utils/taskModels';
import { TASK_CATEGORIES, NUDGE_INTERVALS, CATEGORY_ICONS, CATEGORY_LABELS } from '../../utils/taskModels';
import type { KidProfile } from '../../utils/familyModels';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
  onDelete?: () => Promise<void>;
  task?: Task | null;
  kids: KidProfile[];
}

const KID_COLOR_MAP: Record<string, string> = {
  lavender: '#b39ddb',
  peach: '#ffab91',
  mint: '#80cbc4',
  sky: '#81d4fa',
  amber: '#ffd54f',
  rose: '#f48fb1',
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
function nextWeekStr() {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export default function TaskModal({ isOpen, onClose, onSave, onDelete, task, kids }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('other');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderType, setReminderType] = useState<ReminderType | ''>('');
  const [nudgeInterval, setNudgeInterval] = useState<NudgeInterval | ''>('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setAssignees(task.assignees);
      setDueDate(task.due_date ?? '');
      setPriority(task.priority);
      setCategory(task.category);
      setRecurrence(task.recurrence);
      setReminderTime(task.reminder_time ?? '');
      setReminderType(task.reminder_type ?? '');
      setNudgeInterval(task.nudge_interval ?? '');
    } else {
      setTitle('');
      setDescription('');
      setAssignees([]);
      setDueDate('');
      setPriority('medium');
      setCategory('other');
      setRecurrence('none');
      setReminderTime('');
      setReminderType('');
      setNudgeInterval('');
    }
    setError('');
    setConfirmDelete(false);
  }, [task, isOpen]);

  if (!isOpen) return null;

  const toggleAssignee = (id: string) => {
    setAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (assignees.length === 0) { setError('Select at least one assignee.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        assignees,
        due_date: dueDate || null,
        priority,
        category,
        recurrence,
        reminder_time: reminderTime || null,
        reminder_type: (reminderType as ReminderType) || null,
        nudge_interval: (nudgeInterval as NudgeInterval) || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete. Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
      return;
    }
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-2xl max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center justify-between py-3 mb-2">
            <h2 className="text-lg font-bold text-gray-900">{task ? 'Edit Task' : 'New Task'}</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none hover:text-gray-600">×</button>
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50 resize-none"
            />
          </div>

          {/* Assignees */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to *</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleAssignee('me')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                  assignees.includes('me')
                    ? 'bg-lavender text-white border-lavender'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                Me
              </button>
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  onClick={() => toggleAssignee(kid.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors text-white"
                  style={{
                    backgroundColor: assignees.includes(kid.id) ? KID_COLOR_MAP[kid.color] : 'transparent',
                    borderColor: KID_COLOR_MAP[kid.color],
                    color: assignees.includes(kid.id) ? 'white' : KID_COLOR_MAP[kid.color],
                  }}
                >
                  {kid.name}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
            <div className="flex gap-2 mb-2">
              {[
                { label: 'Today', value: todayStr() },
                { label: 'Tomorrow', value: tomorrowStr() },
                { label: 'Next Week', value: nextWeekStr() },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setDueDate(dueDate === preset.value ? '' : preset.value)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    dueDate === preset.value
                      ? 'bg-lavender text-white border-lavender'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
            />
          </div>

          {/* Priority */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => {
                const styles: Record<TaskPriority, string> = {
                  high: 'border-rose text-rose bg-rose/10',
                  medium: 'border-amber text-amber bg-amber/10',
                  low: 'border-gray-300 text-gray-500 bg-gray-50',
                };
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg border-2 capitalize transition-colors ${
                      priority === p ? styles[p] : 'border-gray-100 text-gray-400 bg-white'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(TASK_CATEGORIES) as (keyof typeof TASK_CATEGORIES)[]).map((key) => {
                const val = TASK_CATEGORIES[key] as TaskCategory;
                return (
                  <button
                    key={val}
                    onClick={() => setCategory(val)}
                    className={`py-2 text-xs font-medium rounded-lg border-2 flex flex-col items-center gap-0.5 transition-colors ${
                      category === val
                        ? 'border-lavender bg-lavender/10 text-lavender'
                        : 'border-gray-100 text-gray-500 bg-gray-50'
                    }`}
                  >
                    <span>{CATEGORY_ICONS[val]}</span>
                    <span>{CATEGORY_LABELS[val]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recurrence */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Repeat</label>
            <div className="flex gap-2">
              {(['none', 'daily', 'weekly', 'monthly'] as TaskRecurrence[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRecurrence(r)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 capitalize transition-colors ${
                    recurrence === r
                      ? 'border-sky bg-sky/10 text-sky'
                      : 'border-gray-100 text-gray-400 bg-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reminder</label>
            <div className="flex gap-2 mb-2">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
              />
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as ReminderType | '')}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
              >
                <option value="">No alert</option>
                <option value="notification">Notification</option>
                <option value="alarm">Alarm</option>
                <option value="nudge">Nudge</option>
              </select>
            </div>
            {reminderType === 'nudge' && (
              <select
                value={nudgeInterval}
                onChange={(e) => setNudgeInterval(Number(e.target.value) as NudgeInterval)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
              >
                <option value="">Every...</option>
                {NUDGE_INTERVALS.map((n) => (
                  <option key={n} value={n}>{n} min</option>
                ))}
              </select>
            )}
          </div>

        </div>

        {/* Sticky footer — always visible */}
        <div className="flex-shrink-0 px-4 pt-3 pb-6 border-t border-gray-100 bg-white flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-lavender text-white font-bold rounded-xl disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </button>

          {task && onDelete && (
            confirmDelete ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-3 bg-rose text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-3 text-rose font-semibold rounded-xl border border-rose/30 hover:bg-red-50 transition-colors"
              >
                Delete Task
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
