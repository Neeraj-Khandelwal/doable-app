import { useState, useEffect, useRef } from 'react';
import type { Task, TaskCategory, TaskPriority, TaskRecurrence, ReminderType, NudgeInterval, Subtask } from '../../utils/taskModels';
import { TASK_CATEGORIES, NUDGE_INTERVALS, CATEGORY_ICONS, CATEGORY_LABELS } from '../../utils/taskModels';
import type { KidProfile } from '../../utils/familyModels';
import { TASK_TEMPLATES } from '../../utils/taskTemplates';

interface Partner {
  userId: string;
  name: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
  onDelete?: () => Promise<void>;
  task?: Task | null;
  kids: KidProfile[];
  partner?: Partner | null;
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

type AdultAssignee = 'me' | 'partner' | 'family' | 'none';

export default function TaskModal({ isOpen, onClose, onSave, onDelete, task, kids, partner }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [adultAssignee, setAdultAssignee] = useState<AdultAssignee>('me');
  const [kidAssignees, setKidAssignees] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('other');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [customDays, setCustomDays] = useState<string>('2');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderType, setReminderType] = useState<ReminderType | ''>('');
  const [nudgeInterval, setNudgeInterval] = useState<NudgeInterval | ''>('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      // Derive adult assignee from existing task fields
      if (task.assigned_to_user_id && partner && task.assigned_to_user_id === partner.userId) {
        setAdultAssignee('partner');
      } else if (!task.assignees.includes('me')) {
        setAdultAssignee('none');
      } else if (!task.is_private) {
        setAdultAssignee('family');
      } else {
        setAdultAssignee('me');
      }
      setKidAssignees(task.assignees.filter((a) => a !== 'me'));
      setDueDate(task.due_date ?? '');
      setPriority(task.priority);
      setCategory(task.category);
      setRecurrence(task.recurrence);
      setCustomDays(task.custom_recurrence_days ? String(task.custom_recurrence_days) : '2');
      setReminderTime(task.reminder_time ?? '');
      setReminderType(task.reminder_type ?? '');
      setNudgeInterval(task.nudge_interval ?? '');
      setSubtasks(task.subtasks ?? []);
    } else {
      setTitle('');
      setDescription('');
      setAdultAssignee('me');
      setKidAssignees([]);
      setDueDate('');
      setPriority('medium');
      setCategory('other');
      setRecurrence('none');
      setReminderTime('');
      setReminderType('');
      setNudgeInterval('');
      setSubtasks([]);
    }
    setSubtaskInput('');
    setError('');
    setConfirmDelete(false);
    setActiveTemplate(null);
    setSaving(false);
  }, [task, isOpen, partner]);

  if (!isOpen) return null;

  const addSubtask = () => {
    const t = subtaskInput.trim();
    if (!t) return;
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), title: t, completed: false }]);
    setSubtaskInput('');
    subtaskInputRef.current?.focus();
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleKidAssignee = (id: string) => {
    setKidAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }

    // Build assignees array and assignment fields from selections
    const assignees: string[] = [];
    let assigned_to_user_id: string | null = null;
    let is_private = false;

    if (adultAssignee === 'me') {
      assignees.push('me');
      is_private = true;
    } else if (adultAssignee === 'partner' && partner) {
      assignees.push('me');
      assigned_to_user_id = partner.userId;
      is_private = true;
    } else if (adultAssignee === 'family') {
      assignees.push('me');
      is_private = false;
    }
    // 'none' = kids only, don't push 'me'
    kidAssignees.forEach((k) => assignees.push(k));

    if (assignees.length === 0) { setError('Select at least one assignee.'); return; }

    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        assignees,
        assigned_to_user_id,
        is_private,
        subtasks,
        due_date: dueDate || null,
        priority,
        category,
        recurrence,
        custom_recurrence_days: recurrence === 'custom' ? (parseInt(customDays, 10) || null) : null,
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

          {/* Template picker — new task only */}
          {!task && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-ink-3 uppercase tracking-wider">Quick Start</label>
                {activeTemplate && (
                  <button
                    onClick={() => { setActiveTemplate(null); setTitle(''); setCategory('other'); setPriority('medium'); setRecurrence('none'); }}
                    className="text-xs text-ink-4 hover:text-ink-2 transition-colors"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {TASK_TEMPLATES.map((tpl) => {
                  const isActive = activeTemplate === tpl.label;
                  return (
                    <button
                      key={tpl.label}
                      onClick={() => {
                        if (isActive) {
                          setActiveTemplate(null);
                          setTitle(''); setCategory('other'); setPriority('medium'); setRecurrence('none');
                        } else {
                          setActiveTemplate(tpl.label);
                          setTitle(tpl.title);
                          setCategory(tpl.category);
                          setPriority(tpl.priority);
                          setRecurrence(tpl.recurrence);
                        }
                      }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                        isActive
                          ? 'bg-plum-soft border-lavender text-lavender'
                          : 'border-line bg-bg-deep text-ink-3 hover:border-lavender hover:text-ink-2'
                      }`}
                    >
                      <span>{tpl.emoji}</span>
                      <span>{tpl.label}</span>
                    </button>
                  );
                })}
              </div>
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

          {/* Subtasks */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtasks</label>
            {subtasks.length > 0 && (
              <div className="mb-2 space-y-1">
                {subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-bg-deep">
                    <button onClick={() => toggleSubtask(s.id)} className="flex-shrink-0 w-5 h-5 rounded border-2 border-line flex items-center justify-center transition-colors" style={s.completed ? { background: '#7C6FF0', borderColor: '#7C6FF0' } : {}}>
                      {s.completed && <span className="text-white text-xs leading-none">✓</span>}
                    </button>
                    <span className={`flex-1 text-sm ${s.completed ? 'line-through text-ink-4' : 'text-ink'}`}>{s.title}</span>
                    <button onClick={() => removeSubtask(s.id)} className="text-ink-4 hover:text-red text-xs px-1">✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={subtaskInputRef}
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                placeholder="Add a subtask…"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
              />
              <button onClick={addSubtask} disabled={!subtaskInput.trim()} className="px-3 py-2 bg-lavender text-white rounded-lg text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity">+</button>
            </div>
          </div>

          {/* Assignees */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to *</label>

            {/* Adult section */}
            <div className="flex flex-wrap gap-2 mb-2">
              {([
                { key: 'me', label: '🔒 Me (private)' },
                ...(partner ? [{ key: 'partner', label: `👤 ${partner.name}` }] : []),
                { key: 'family', label: '👨‍👩‍👧 Family' },
              ] as { key: AdultAssignee; label: string }[]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setAdultAssignee((prev) => prev === opt.key ? 'none' : opt.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                    adultAssignee === opt.key
                      ? 'bg-lavender text-white border-lavender'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Partner info banner */}
            {adultAssignee === 'partner' && (
              <div className="mb-2 px-3 py-2 bg-lavender/10 border border-lavender/30 rounded-lg text-xs text-lavender">
                {partner?.name} will be notified and can accept or reject this task.
              </div>
            )}

            {/* Kids multi-select */}
            {kids.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {kids.map((kid) => (
                  <button
                    key={kid.id}
                    onClick={() => toggleKidAssignee(kid.id)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors"
                    style={{
                      backgroundColor: kidAssignees.includes(kid.id) ? KID_COLOR_MAP[kid.color] : 'transparent',
                      borderColor: KID_COLOR_MAP[kid.color],
                      color: kidAssignees.includes(kid.id) ? 'white' : KID_COLOR_MAP[kid.color],
                    }}
                  >
                    {kid.name}
                  </button>
                ))}
              </div>
            )}
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
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'none', label: 'None' },
                { key: 'daily', label: 'Daily' },
                { key: 'weekly', label: 'Weekly' },
                { key: 'fortnightly', label: 'Fortnightly' },
                { key: 'monthly', label: 'Monthly' },
                { key: 'custom', label: 'Custom' },
              ] as { key: TaskRecurrence; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRecurrence(key)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-colors ${
                    recurrence === key
                      ? 'border-sky bg-sky/10 text-sky'
                      : 'border-gray-100 text-gray-400 bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {recurrence === 'custom' && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-gray-600 font-medium">Every</span>
                <input
                  type="number"
                  min="2"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky bg-gray-50"
                />
                <span className="text-sm text-gray-600 font-medium">days</span>
              </div>
            )}
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
