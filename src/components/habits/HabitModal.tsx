import { useState, useEffect } from 'react';
import type { Habit, HabitCategory, HabitFrequency } from '../../utils/habitModels';
import {
  HABIT_ICONS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  HABIT_CATEGORIES,
  FREQUENCY_LABELS,
  DAY_LABELS,
} from '../../utils/habitModels';
import type { KidProfile } from '../../utils/familyModels';

const KID_COLOR_MAP: Record<string, string> = {
  lavender: '#b39ddb',
  peach: '#ffab91',
  mint: '#80cbc4',
  sky: '#81d4fa',
  amber: '#ffd54f',
  rose: '#f48fb1',
};

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Habit>) => Promise<void>;
  onDelete?: () => Promise<void>;
  habit?: Habit | null;
  kids: KidProfile[];
}

export default function HabitModal({ isOpen, onClose, onSave, onDelete, habit, kids }: HabitModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [category, setCategory] = useState<HabitCategory>('other');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([]);
  const [targetCount, setTargetCount] = useState(1);
  const [icon, setIcon] = useState('✅');
  const [reminderTime, setReminderTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description ?? '');
      setAssignees(habit.assignees);
      setCategory(habit.category);
      setFrequency(habit.frequency);
      setFrequencyDays(habit.frequency_days ?? []);
      setTargetCount(habit.target_count);
      setIcon(habit.icon);
      setReminderTime(habit.reminder_time ?? '');
    } else {
      setTitle('');
      setDescription('');
      setAssignees([]);
      setCategory('other');
      setFrequency('daily');
      setFrequencyDays([]);
      setTargetCount(1);
      setIcon('✅');
      setReminderTime('');
    }
    setError('');
    setConfirmDelete(false);
  }, [habit, isOpen]);

  if (!isOpen) return null;

  const toggleAssignee = (id: string) => {
    setAssignees((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const toggleDay = (day: number) => {
    setFrequencyDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (assignees.length === 0) { setError('Select at least one assignee.'); return; }
    if (frequency === 'custom' && frequencyDays.length === 0) {
      setError('Select at least one day for custom schedule.'); return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        assignees,
        category,
        frequency,
        frequency_days: frequency === 'custom' ? frequencyDays : null,
        target_count: targetCount,
        icon,
        reminder_time: reminderTime || null,
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
      <div className="relative bg-white rounded-t-2xl max-h-[92vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center justify-between py-3 mb-2">
            <h2 className="text-lg font-bold text-gray-900">{habit ? 'Edit Habit' : 'New Habit'}</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none hover:text-gray-600">×</button>
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Icon picker */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-1.5">
              {HABIT_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-lavender/15 ring-2 ring-lavender'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning run, Read 10 pages..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
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
                  className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors"
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

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(HABIT_CATEGORIES) as (keyof typeof HABIT_CATEGORIES)[]).map((key) => {
                const val = HABIT_CATEGORIES[key] as HabitCategory;
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

          {/* Frequency */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {(['daily', 'weekdays', 'weekends', 'custom'] as HabitFrequency[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                    frequency === f
                      ? 'border-sky bg-sky/10 text-sky'
                      : 'border-gray-100 text-gray-500 bg-gray-50'
                  }`}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>

            {frequency === 'custom' && (
              <div className="flex gap-1.5 mt-2">
                {DAY_LABELS.map((label, day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-colors ${
                      frequencyDays.includes(day)
                        ? 'border-sky bg-sky text-white'
                        : 'border-gray-200 text-gray-500 bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Times per day */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Times per day</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTargetCount((c) => Math.max(1, c - 1))}
                disabled={targetCount <= 1}
                className="w-9 h-9 rounded-full border-2 border-gray-200 text-gray-600 font-bold text-lg flex items-center justify-center disabled:opacity-30"
              >
                −
              </button>
              <span className="text-2xl font-bold text-gray-900 w-8 text-center">{targetCount}</span>
              <button
                onClick={() => setTargetCount((c) => Math.min(5, c + 1))}
                disabled={targetCount >= 5}
                className="w-9 h-9 rounded-full border-2 border-lavender text-lavender font-bold text-lg flex items-center justify-center disabled:opacity-30"
              >
                +
              </button>
              <span className="text-sm text-gray-400 ml-1">
                {targetCount === 1 ? 'once' : `${targetCount}×`} daily
              </span>
            </div>
          </div>

          {/* Reminder */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Reminder (optional)</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any notes or details..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50 resize-none"
            />
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex-shrink-0 px-4 pt-3 pb-6 border-t border-gray-100 bg-white flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-lavender text-white font-bold rounded-xl disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving...' : habit ? 'Update Habit' : 'Create Habit'}
          </button>

          {habit && onDelete && (
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
                Delete Habit
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
