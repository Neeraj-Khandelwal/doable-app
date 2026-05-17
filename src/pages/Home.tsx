import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useTaskContext } from '../context/TaskContext';
import { useHabitContext } from '../context/HabitContext';
import { useFamilyContext } from '../context/FamilyContext';
import { useGroceryContext } from '../context/GroceryContext';
import { supabase } from '../supabaseClient';
import FastingCard from '../components/fasting/FastingCard';
import { CATEGORY_ICONS, isKidTask } from '../utils/taskModels';
import type { Task } from '../utils/taskModels';
import RatingModal from '../components/tasks/RatingModal';
import { isScheduledToday } from '../utils/habitModels';

const KID_COLOR_MAP: Record<string, string> = {
  lavender: '#7C6FF0',
  peach: '#FF8F5E',
  mint: '#2EB87A',
  sky: '#2FA8E0',
  amber: '#E8A800',
  rose: '#E85450',
};

export default function Home() {
  const { user } = useAuthContext();
  const { tasks, createTask, markComplete, rateAndComplete } = useTaskContext();
  const { habits } = useHabitContext();
  const { kidProfiles, familyMembers } = useFamilyContext();
  const { items: groceryItems, addItem: addGroceryItem, togglePurchased } = useGroceryContext();

  const partner = useMemo(() => {
    const m = familyMembers.find((fm) => fm.user_id !== user?.id);
    if (!m) return null;
    return { userId: m.user_id, name: m.display_name ?? 'Partner' };
  }, [familyMembers, user?.id]);

  const alarmCount =
    tasks.filter((t) => !!t.reminder_time && !t.completed_at).length +
    habits.filter((h) => !!h.reminder_time && isScheduledToday(h)).length +
    tasks.filter((t) => t.assigned_to_user_id === user?.id && t.assignment_status === 'pending_acceptance').length;
  const navigate = useNavigate();

  const [fullName, setFullName] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [assignees, setAssignees] = useState<string[]>(['me']);
  const [partnerSelected, setPartnerSelected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ratingTask, setRatingTask] = useState<Task | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCompletePress = (task: Task) => {
    if (isKidTask(task)) {
      setRatingTask(task);
    } else {
      void markComplete(task.id);
    }
  };

  const handleRatingConfirm = async (ratings: { kid_id: string; rating_type: string }[]) => {
    if (ratingTask) {
      await rateAndComplete(ratingTask.id, ratings as any);
      setRatingTask(null);
    }
  };

  // Grocery quick-add
  const [groceryInput, setGroceryInput] = useState('');
  const groceryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
      });
  }, [user?.id]);

  // Active tasks assigned to me, overdue first, max 5
  const myActiveTasks = tasks
    .filter((t) => !t.completed_at && t.assignees.includes('me'))
    .sort((a, b) => {
      if (a.is_overdue && !b.is_overdue) return -1;
      if (!a.is_overdue && b.is_overdue) return 1;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    })
    .slice(0, 5);

  const displayName =
    fullName ||
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const firstName = displayName.split(' ')[0];

  const nameFor = useMemo(() => {
    const first = (s: string) => s.split(' ')[0];
    const map: Record<string, string> = {};
    familyMembers.forEach((m) => {
      map[m.user_id] = first(m.display_name ?? (m.role === 'owner' ? 'Owner' : 'Partner'));
    });
    return (userId: string | null): string | undefined => {
      if (!userId) return undefined;
      if (userId === user?.id) return first(displayName);
      return map[userId];
    };
  }, [familyMembers, user?.id, displayName]);

  const toggleAssignee = (id: string) => {
    setAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleAddTask = async () => {
    if (!title.trim()) {
      inputRef.current?.focus();
      return;
    }
    if (assignees.length === 0 && !partnerSelected) {
      setSaveError('Select at least one assignee.');
      return;
    }
    setSaving(true);
    setSaveError('');

    const payload: Parameters<typeof createTask>[0] = partnerSelected && partner
      ? {
          title: title.trim(),
          assignees: ['me'],
          assigned_to_user_id: partner.userId,
          is_private: true,
        }
      : {
          title: title.trim(),
          assignees,
          is_private: assignees.length === 1 && assignees[0] === 'me',
        };

    const result = await createTask(payload);
    if (result?.error) {
      setSaveError(result.error);
    } else {
      setTitle('');
      setAssignees(['me']);
      setPartnerSelected(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setSaving(false);
  };

  const handleAddGrocery = async () => {
    const trimmed = groceryInput.trim();
    if (!trimmed) { groceryInputRef.current?.focus(); return; }
    setGroceryInput('');
    await addGroceryItem(trimmed);
    groceryInputRef.current?.focus();
  };

  const unpurchasedGrocery = groceryItems.filter((i) => !i.is_purchased);
  const purchasedGrocery = groceryItems.filter((i) => i.is_purchased);
  const previewItems = [...unpurchasedGrocery, ...purchasedGrocery].slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">
            Hey, {firstName}! 👋
          </h1>
          <p className="text-sm text-ink-3 mt-0.5">What needs to get done today?</p>
        </div>
        {/* Voice + Alarms */}
        <div className="flex items-center gap-1 -mr-1">
        <button
          onClick={() => navigate('/test-voice')}
          className="p-2 rounded-xl hover:bg-bg-deep transition-colors"
          aria-label="Voice task"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
            className="w-6 h-6 text-ink-2">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
          </svg>
        </button>
        <button
          onClick={() => navigate('/alarms')}
          className="relative p-2 rounded-xl hover:bg-bg-deep transition-colors"
          aria-label="Alarms"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
            className="w-6 h-6 text-ink-2">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {alarmCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
              {alarmCount > 9 ? '9+' : alarmCount}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/family', { state: { tab: 'account' } })}
          className="p-2 rounded-xl hover:bg-bg-deep transition-colors"
          aria-label="Settings"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
            className="w-6 h-6 text-ink-2">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
        </div>
      </div>

      {/* ── QUICK TASK CREATION ── */}
      <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-3">
        <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider">Add a Task</h2>

        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleAddTask()}
          placeholder="What needs to be done?"
          className="w-full px-4 py-3 bg-bg-deep border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-lavender focus:border-transparent"
        />

        {/* Assignee pills */}
        <div>
          <p className="text-xs text-ink-4 mb-2">Assign to</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleAssignee('me')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                assignees.includes('me')
                  ? 'bg-lavender border-lavender text-white'
                  : 'border-line text-ink-3 bg-white hover:border-lavender hover:text-lavender'
              }`}
            >
              Me
            </button>
            {partner && (
              <button
                onClick={() => setPartnerSelected((p) => !p)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                  partnerSelected
                    ? 'bg-sky border-sky text-white'
                    : 'border-line text-ink-3 bg-white hover:border-sky hover:text-sky'
                }`}
              >
                {partner.name}
              </button>
            )}
            {kidProfiles.map((kid) => {
              const color = KID_COLOR_MAP[kid.color] ?? '#7C6FF0';
              const selected = assignees.includes(kid.id);
              return (
                <button
                  key={kid.id}
                  onClick={() => toggleAssignee(kid.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                  style={
                    selected
                      ? { backgroundColor: color, borderColor: color, color: '#fff' }
                      : { borderColor: '#EAE2D2', color: '#6E665E', backgroundColor: '#fff' }
                  }
                >
                  {kid.name}
                </button>
              );
            })}
          </div>
          {partnerSelected && (
            <p className="text-xs text-ink-4 mt-1.5">{partner?.name} will be notified and can accept or reject.</p>
          )}
        </div>

        {saveError && (
          <p className="text-xs text-rose font-medium">{saveError}</p>
        )}

        <button
          onClick={() => void handleAddTask()}
          disabled={saving || !title.trim()}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            saveSuccess
              ? 'bg-mint text-white'
              : 'bg-lavender text-white hover:opacity-90 disabled:opacity-40'
          }`}
        >
          {saving ? 'Adding…' : saveSuccess ? '✓ Task added!' : '+ Add Task'}
        </button>
      </div>

      {/* ── FASTING CARD ── */}
      <FastingCard />

      {/* ── MY ACTIVE TASKS ── */}
      <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider">My Tasks</h2>
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-semibold text-lavender hover:opacity-80"
          >
            View all
          </button>
        </div>

        {myActiveTasks.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm text-ink-4">All caught up! No active tasks.</p>
          </div>
        ) : (
          myActiveTasks.map((task: Task) => {
            const isOverdue = task.is_overdue;
            const priority = task.priority;
            const priorityColors: Record<string, string> = {
              high: 'bg-rose/15 text-rose',
              medium: 'bg-amber/15 text-amber',
              low: 'bg-bg-deep text-ink-4',
            };
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-bg transition-colors"
              >
                <button
                  onClick={() => handleCompletePress(task)}
                  className="w-6 h-6 rounded-full border-2 border-line flex-shrink-0 hover:border-mint hover:bg-mint/10 transition-colors"
                  aria-label="Mark complete"
                />
                <span className="text-base flex-shrink-0">{CATEGORY_ICONS[task.category]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{task.title}</p>
                  {task.due_date && (
                    <p className={`text-xs mt-0.5 ${isOverdue ? 'text-rose font-semibold' : 'text-ink-4'}`}>
                      {isOverdue ? '⚠ Overdue · ' : ''}
                      {new Date(task.due_date + 'T00:00:00').toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                {priority !== 'medium' && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${priorityColors[priority]}`}>
                    {priority}
                  </span>
                )}
              </div>
            );
          })
        )}

        {tasks.filter((t) => !t.completed_at && t.assignees.includes('me')).length > 5 && (
          <button
            onClick={() => navigate('/tasks')}
            className="w-full pt-1 text-xs text-ink-4 hover:text-lavender text-center transition-colors"
          >
            +{tasks.filter((t) => !t.completed_at && t.assignees.includes('me')).length - 5} more tasks →
          </button>
        )}
      </div>

      {/* ── GROCERY LIST ── */}
      <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider">🛒 Grocery List</h2>
          <button
            onClick={() => navigate('/grocery')}
            className="text-xs font-semibold text-lavender hover:opacity-80"
          >
            View all
          </button>
        </div>

        {/* Quick-add */}
        <div className="flex gap-2">
          <input
            ref={groceryInputRef}
            type="text"
            value={groceryInput}
            onChange={(e) => setGroceryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleAddGrocery()}
            placeholder="Add item…"
            className="flex-1 px-3 py-2.5 bg-bg-deep border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-lavender"
          />
          <button
            onClick={() => void handleAddGrocery()}
            disabled={!groceryInput.trim()}
            className="px-4 py-2 bg-lavender text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            +
          </button>
        </div>

        {/* Items preview */}
        {groceryItems.length === 0 ? (
          <p className="text-sm text-ink-4 text-center py-2">No items on the list</p>
        ) : (
          <div className="space-y-1">
            {previewItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-1.5">
                <button
                  onClick={() => void togglePurchased(item.id)}
                  className={`w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                    item.is_purchased
                      ? 'bg-green border-green'
                      : 'border-line hover:border-lavender'
                  }`}
                >
                  {item.is_purchased && (
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm block truncate ${item.is_purchased ? 'line-through text-ink-4' : 'text-ink'}`}>
                    {item.name}
                    {nameFor(item.added_by) && (
                      <span className="text-ink-4 font-normal"> — Added by {nameFor(item.added_by)}</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
            {groceryItems.length > 5 && (
              <button
                onClick={() => navigate('/grocery')}
                className="w-full pt-1 text-xs text-ink-4 hover:text-lavender text-center transition-colors"
              >
                +{groceryItems.length - 5} more items →
              </button>
            )}
          </div>
        )}
      </div>

      {/* FAB — opens task creation modal */}
      <button
        onClick={() => navigate('/tasks', { state: { openModal: true } })}
        className="fixed bottom-24 right-4 w-14 h-14 bg-ink text-bg rounded-2xl shadow-lg text-2xl font-bold flex items-center justify-center hover:opacity-80 transition-all active:scale-95 z-40"
        aria-label="Create task"
      >
        +
      </button>

      <RatingModal
        isOpen={!!ratingTask}
        onClose={() => setRatingTask(null)}
        onConfirm={handleRatingConfirm}
        task={ratingTask}
        kids={kidProfiles}
      />
    </div>
  );
}
