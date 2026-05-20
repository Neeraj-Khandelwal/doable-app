import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from './AuthContext';
import { useFamilyContext } from './FamilyContext';
import { type Habit, type HabitCompletion, todayStr, computeStreak } from '../utils/habitModels';

type HabitContextValue = {
  habits: Habit[];
  completions: HabitCompletion[];
  loading: boolean;
  error: string | null;
  createHabit: (data: Partial<Habit>) => Promise<{ data?: Habit; error?: string }>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<{ data?: Habit; error?: string }>;
  deleteHabit: (id: string) => Promise<{ error?: string }>;
  completeHabit: (habitId: string, assignee: string) => Promise<{ error?: string; bonusAwarded?: boolean }>;
  undoComplete: (habitId: string, assignee: string) => Promise<{ error?: string }>;
  getTodayCount: (habitId: string, assignee: string) => number;
  getStreak: (habit: Habit, assignee: string) => number;
  refreshHabits: () => Promise<void>;
  resetHabitProgress: () => Promise<{ error?: string }>;
};

const HabitContext = createContext<HabitContextValue | undefined>(undefined);

export const useHabitContext = () => {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabitContext must be used within HabitProvider');
  return ctx;
};

export const HabitProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const { family } = useFamilyContext();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    if (!family?.id) {
      setHabits([]);
      setCompletions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const thirtyDaysAgo = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
    })();

    const [habitsRes, completionsRes] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('habit_completions')
        .select('*')
        .eq('family_id', family.id)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: false }),
    ]);

    if (habitsRes.error) setError('Unable to load habits.');
    else setHabits((habitsRes.data ?? []) as Habit[]);

    if (!completionsRes.error) setCompletions((completionsRes.data ?? []) as HabitCompletion[]);

    setLoading(false);
  }, [family?.id]);

  useEffect(() => { void fetchHabits(); }, [fetchHabits]);

  const getTodayCount = (habitId: string, assignee: string): number => {
    const today = todayStr();
    return completions.filter(
      (c) => c.habit_id === habitId && c.completed_by === assignee && c.date === today
    ).length;
  };

  const getStreak = (habit: Habit, assignee: string): number => {
    return computeStreak(completions, assignee, habit);
  };

  const completeHabit = async (habitId: string, assignee: string): Promise<{ error?: string; bonusAwarded?: boolean }> => {
    if (!family?.id) return { error: 'No family' };
    const today = todayStr();

    const { data, error: insertError } = await supabase
      .from('habit_completions')
      .insert([{ habit_id: habitId, family_id: family.id, completed_by: assignee, date: today }])
      .select()
      .single();

    if (insertError) return { error: insertError.message };

    const newCompletion = data as HabitCompletion;
    setCompletions((prev) => [newCompletion, ...prev]);

    // Award points — kids only (not 'me')
    if (assignee !== 'me') {
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        // 1 point per completion
        await supabase.from('kid_point_events').insert([{
          kid_id: assignee,
          family_id: family.id,
          points: 1,
          reason: `Habit: ${habit.title}`,
          type: 'habit_completion',
          habit_id: habitId,
          created_by: user?.id ?? 'system',
          event_date: today,
        }]);

        // 5-point bonus every 7-day streak
        const updatedCompletions = [newCompletion, ...completions];
        const newStreak = computeStreak(updatedCompletions, assignee, habit);
        if (newStreak > 0 && newStreak % 7 === 0) {
          const { error: bonusErr } = await supabase
            .from('kid_point_events')
            .insert([{
              kid_id: assignee,
              family_id: family.id,
              points: 5,
              reason: `7-day streak: ${habit.title}`,
              type: 'streak_bonus',
              habit_id: habitId,
              created_by: user?.id ?? 'system',
              event_date: today,
            }]);

          if (!bonusErr) return { bonusAwarded: true };
        }
      }
    }

    return {};
  };

  const undoComplete = async (habitId: string, assignee: string) => {
    const today = todayStr();
    const latest = completions.find(
      (c) => c.habit_id === habitId && c.completed_by === assignee && c.date === today
    );
    if (!latest) return {};

    const { error: deleteError } = await supabase
      .from('habit_completions')
      .delete()
      .eq('id', latest.id);

    if (deleteError) return { error: deleteError.message };

    setCompletions((prev) => prev.filter((c) => c.id !== latest.id));
    return {};
  };

  const createHabit = async (data: Partial<Habit>) => {
    if (!family?.id || !user?.id) return { error: 'Not authenticated' };

    const payload = {
      family_id: family.id,
      created_by: user.id,
      title: data.title,
      description: data.description ?? null,
      assignees: data.assignees ?? [],
      category: data.category ?? 'other',
      frequency: data.frequency ?? 'daily',
      frequency_days: data.frequency_days ?? null,
      target_count: data.target_count ?? 1,
      icon: data.icon ?? '✅',
      reminder_time: data.reminder_time ?? null,
      is_active: true,
    };

    const { data: created, error: insertError } = await supabase
      .from('habits')
      .insert([payload])
      .select()
      .single();

    if (insertError) return { error: insertError.message };

    setHabits((prev) => [...prev, created as Habit]);
    return { data: created as Habit };
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    const { data: updated, error: updateError } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) return { error: updateError.message };

    setHabits((prev) => prev.map((h) => (h.id === id ? (updated as Habit) : h)));
    return { data: updated as Habit };
  };

  const deleteHabit = async (id: string) => {
    const { error: updateError } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', id);

    if (updateError) return { error: updateError.message };

    setHabits((prev) => prev.filter((h) => h.id !== id));
    return {};
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        completions,
        loading,
        error,
        createHabit,
        updateHabit,
        deleteHabit,
        completeHabit,
        undoComplete,
        getTodayCount,
        getStreak,
        refreshHabits: fetchHabits,
        resetHabitProgress: async () => {
          if (!family?.id) return { error: 'No family' };
          const { error: err } = await supabase.from('habit_completions').delete().eq('family_id', family.id);
          if (err) return { error: err.message };
          await fetchHabits();
          return {};
        },
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};
