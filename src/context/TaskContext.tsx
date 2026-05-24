import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from './AuthContext';
import { useFamilyContext } from './FamilyContext';
import {
  type Task,
  isTaskOverdue,
  getNextDueDate,
  type RatingType,
  RATING_OPTIONS,
} from '../utils/taskModels';
import type { RepeatDay } from '../utils/alarmModels';
import { cancelReminderNotification, fireImmediateNotification, idFromUuid, scheduleReminderNotification } from '../services/notificationService';
import { isAndroidSystemClockAvailable, openSystemClockSetAlarm } from '../services/androidClockAlarm';

export type TaskFilter = 'all' | 'active' | 'done' | 'high';

type TaskContextValue = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filter: TaskFilter;
  setFilter: (f: TaskFilter) => void;
  filteredTasks: Task[];
  createTask: (data: Omit<Partial<Task>, 'id' | 'created_at' | 'updated_at'>) => Promise<{ data?: Task; error?: string }>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<{ data?: Task; error?: string }>;
  deleteTask: (id: string) => Promise<{ error?: string }>;
  markComplete: (id: string) => Promise<{ error?: string }>;
  rateAndComplete: (id: string, ratings: { kid_id: string; rating_type: RatingType }[]) => Promise<{ error?: string }>;
  acceptTask: (id: string) => Promise<{ error?: string }>;
  rejectTask: (id: string, reason: string) => Promise<{ error?: string }>;
  refreshTasks: () => Promise<void>;
  resetAllTasks: () => Promise<{ error?: string }>;
};

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

/**
 * Converts a task due date and recurrence into Android Clock repeat days.
 * Call with a saved task; returns all days for daily, the due-date weekday for weekly, and empty for one-time/monthly.
 */
function getTaskAlarmRepeatDays(task: Pick<Task, 'due_date' | 'recurrence'>): RepeatDay[] {
  if (task.recurrence === 'daily') return [0, 1, 2, 3, 4, 5, 6];
  if (task.recurrence !== 'weekly' || !task.due_date) return [];

  const [year, month, day] = task.due_date.split('-').map(Number);
  return [new Date(year, month - 1, day).getDay() as RepeatDay];
}

/**
 * Sends task reminder alarms to Android Clock and falls back to a local notification when native fails.
 * Call after creating/updating a task with `reminder_type: 'alarm'`; returns after Clock opens or fallback schedules.
 */
async function scheduleTaskAlarmDelivery(task: Task, previousNudgeInterval = 0): Promise<void> {
  if (!task.reminder_time || task.reminder_type !== 'alarm' || task.completed_at) return;

  const notifId = idFromUuid(task.id);
  const title = `📌 ${task.title}`;

  if (isAndroidSystemClockAvailable()) {
    try {
      const result = await openSystemClockSetAlarm(
        task.reminder_time,
        task.title,
        getTaskAlarmRepeatDays(task),
      );

      if (result.success) {
        await cancelReminderNotification(notifId, previousNudgeInterval);
        return;
      }

      console.warn('Android Clock task alarm creation failed; falling back to local notification:', result.message);
    } catch (err) {
      console.warn('Android Clock task alarm creation threw; falling back to local notification:', err);
    }
  }

  await scheduleReminderNotification(notifId, task.reminder_time, title, "Don't forget this task!", 0);
}

export const useTaskContext = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider');
  return ctx;
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const { family } = useFamilyContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>('all');

  const prevTasksRef = useRef<Task[]>([]);
  const hasLoadedOnceRef = useRef(false);

  const fetchTasks = useCallback(async () => {
    if (!family?.id) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Unable to load tasks.');
      setLoading(false);
      return;
    }

    const enriched = (data ?? []).map((t: Task) => ({
      ...t,
      is_overdue: isTaskOverdue(t),
    }));

    // Fire notifications for assignment events (skip on initial load)
    if (hasLoadedOnceRef.current) {
      const prev = prevTasksRef.current;
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        enriched.forEach((t) => {
          // Case 1: new task assigned to me (partner assigned me a task)
          if (
            t.assigned_to_user_id === userId &&
            t.assignment_status === 'pending_acceptance' &&
            !prev.find((p) => p.id === t.id)
          ) {
            void fireImmediateNotification('New task assigned to you', `"${t.title}" — tap to respond`, idFromUuid(t.id));
          }
          // Cases 2 & 3: status change on a task I created
          if (t.created_by === userId && t.assigned_to_user_id) {
            const old = prev.find((p) => p.id === t.id);
            if (old?.assignment_status === 'pending_acceptance' && t.assignment_status === 'accepted') {
              void fireImmediateNotification('Task accepted ✓', `"${t.title}" was accepted`, idFromUuid(t.id) + 1);
            }
            if (old?.assignment_status === 'pending_acceptance' && t.assignment_status === 'rejected') {
              void fireImmediateNotification('Task rejected', `"${t.title}" was rejected`, idFromUuid(t.id) + 2);
            }
          }
        });
      }
    }

    prevTasksRef.current = enriched;
    hasLoadedOnceRef.current = true;
    setTasks(enriched);
    setLoading(false);
  }, [family?.id]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    if (!family?.id) return;

    const channel = supabase
      .channel(`tasks:${family.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${family.id}` }, () => {
        void fetchTasks();
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [family?.id, fetchTasks]);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    // Sort: overdue first, then by due_date, then by created_at
    list.sort((a, b) => {
      if (a.is_overdue && !b.is_overdue) return -1;
      if (!a.is_overdue && b.is_overdue) return 1;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    });

    switch (filter) {
      case 'active': return list.filter((t) => !t.completed_at);
      case 'done': return list.filter((t) => !!t.completed_at);
      case 'high': return list.filter((t) => t.priority === 'high' && !t.completed_at);
      default: return list;
    }
  }, [tasks, filter]);

  const createTask = async (data: Omit<Partial<Task>, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return { error: 'Not authenticated' };
    if (!family?.id) return { error: 'Please create or join a family first' };

    const assignedToUserId = data.assigned_to_user_id ?? null;
    const payload = {
      family_id: family.id,
      created_by: user.id,
      title: data.title,
      description: data.description ?? null,
      assignees: data.assignees ?? [],
      due_date: data.due_date ?? null,
      reminder_time: data.reminder_time ?? null,
      reminder_type: data.reminder_type ?? null,
      nudge_interval: data.nudge_interval ?? null,
      priority: data.priority ?? 'medium',
      category: data.category ?? 'other',
      recurrence: data.recurrence ?? 'none',
      custom_recurrence_days: data.recurrence === 'custom' ? (data.custom_recurrence_days ?? null) : null,
      ratings: [],
      assigned_to_user_id: assignedToUserId,
      assignment_status: assignedToUserId && assignedToUserId !== user.id ? 'pending_acceptance' : 'accepted',
      rejection_reason: null,
      responded_at: null,
      is_private: data.is_private ?? false,
    };

    const { data: created, error: insertError } = await supabase
      .from('tasks')
      .insert([payload])
      .select()
      .single();

    if (insertError) return { error: insertError.message };

    const task = { ...created, is_overdue: isTaskOverdue(created) } as Task;
    setTasks((prev) => [task, ...prev]);
    await scheduleTaskAlarmDelivery(task);
    return { data: task };
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) return { error: updateError.message };

    const task = { ...updated, is_overdue: isTaskOverdue(updated) } as Task;
    const previousTask = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    if (previousTask?.reminder_time && previousTask.reminder_type !== task.reminder_type) {
      await cancelReminderNotification(idFromUuid(id), previousTask.nudge_interval ?? 0);
    }
    await scheduleTaskAlarmDelivery(task, previousTask?.nudge_interval ?? 0);
    return { data: task };
  };

  const deleteTask = async (id: string) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id);
    if (deleteError) return { error: deleteError.message };
    const task = tasks.find((t) => t.id === id);
    if (task?.reminder_time) {
      await cancelReminderNotification(idFromUuid(id), task.nudge_interval ?? 0);
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    return {};
  };

  const markComplete = async (id: string) => {
    if (!user?.id) return { error: 'Not authenticated' };
    return updateTask(id, { completed_by: user.id, completed_at: new Date().toISOString() }).then(async (result) => {
      if (result.error) return result;
      // Handle recurrence: create next occurrence
      const task = tasks.find((t) => t.id === id);
      if (task?.recurrence !== 'none' && task?.due_date) {
        const nextDue = getNextDueDate(task.due_date, task.recurrence, task.custom_recurrence_days);
        if (nextDue) {
          await createTask({
            ...task,
            due_date: nextDue,
            completed_by: null,
            completed_at: null,
            ratings: [],
          });
        }
      }
      return {};
    });
  };

  const rateAndComplete = async (id: string, kidRatings: { kid_id: string; rating_type: RatingType }[]) => {
    if (!user?.id) return { error: 'Not authenticated' };

    const ratings = kidRatings.map((r) => ({
      kid_id: r.kid_id,
      rating_type: r.rating_type,
      points: RATING_OPTIONS.find((o) => o.type === r.rating_type)?.points ?? 0,
      timestamp: new Date().toISOString(),
    }));

    return updateTask(id, {
      ratings,
      completed_by: user.id,
      completed_at: new Date().toISOString(),
    }).then(async (result) => {
      if (result.error) return result;
      const task = tasks.find((t) => t.id === id);
      if (task?.recurrence !== 'none' && task?.due_date) {
        const nextDue = getNextDueDate(task.due_date, task.recurrence, task.custom_recurrence_days);
        if (nextDue) {
          await createTask({ ...task, due_date: nextDue, completed_by: null, completed_at: null, ratings: [] });
        }
      }
      return {};
    });
  };

  const acceptTask = async (id: string) => {
    return updateTask(id, {
      assignment_status: 'accepted',
      responded_at: new Date().toISOString(),
    }).then((r) => ({ error: r.error }));
  };

  const rejectTask = async (id: string, reason: string) => {
    return updateTask(id, {
      assignment_status: 'rejected',
      rejection_reason: reason || null,
      responded_at: new Date().toISOString(),
    }).then((r) => ({ error: r.error }));
  };

  const value: TaskContextValue = {
    tasks,
    loading,
    error,
    filter,
    setFilter,
    filteredTasks,
    createTask,
    updateTask,
    deleteTask,
    markComplete,
    rateAndComplete,
    acceptTask,
    rejectTask,
    refreshTasks: fetchTasks,
    resetAllTasks: async () => {
      if (!family?.id) return { error: 'No family' };
      const { error: err } = await supabase.from('tasks').delete().eq('family_id', family.id);
      if (err) return { error: err.message };
      await fetchTasks();
      return {};
    },
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
