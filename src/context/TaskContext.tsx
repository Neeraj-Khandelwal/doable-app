import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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
  refreshTasks: () => Promise<void>;
};

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

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
    if (!family?.id || !user?.id) return { error: 'Not authenticated' };

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
      ratings: [],
    };

    const { data: created, error: insertError } = await supabase
      .from('tasks')
      .insert([payload])
      .select()
      .single();

    if (insertError) return { error: insertError.message };

    const task = { ...created, is_overdue: isTaskOverdue(created) } as Task;
    setTasks((prev) => [task, ...prev]);
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
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return { data: task };
  };

  const deleteTask = async (id: string) => {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id);
    if (deleteError) return { error: deleteError.message };
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
        const nextDue = getNextDueDate(task.due_date, task.recurrence);
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
        const nextDue = getNextDueDate(task.due_date, task.recurrence);
        if (nextDue) {
          await createTask({ ...task, due_date: nextDue, completed_by: null, completed_at: null, ratings: [] });
        }
      }
      return {};
    });
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
    refreshTasks: fetchTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
