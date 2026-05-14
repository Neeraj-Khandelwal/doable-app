import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from './AuthContext';
import { useFamilyContext } from './FamilyContext';
import type { FastSession } from '../utils/fastingModels';
import { DEFAULT_GOAL_HOURS } from '../utils/fastingModels';

type FastingContextValue = {
  currentSession: FastSession | null;
  sessionHistory: FastSession[];
  goalHours: number;
  elapsedSeconds: number;
  loading: boolean;
  error: string | null;
  startFast: () => Promise<{ error?: string }>;
  endFast: () => Promise<{ error?: string }>;
  setGoal: (hours: number) => Promise<{ error?: string }>;
};

const FastingContext = createContext<FastingContextValue | undefined>(undefined);

export const useFastingContext = () => {
  const ctx = useContext(FastingContext);
  if (!ctx) throw new Error('useFastingContext must be used within FastingProvider');
  return ctx;
};

export const FastingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const { family } = useFamilyContext();

  const [currentSession, setCurrentSession] = useState<FastSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<FastSession[]>([]);
  const [goalHours, setGoalHours] = useState(DEFAULT_GOAL_HOURS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live 1-second ticker while a fast is active
  useEffect(() => {
    if (currentSession) {
      const tick = () => {
        const diff = Math.floor(
          (Date.now() - new Date(currentSession.start_time).getTime()) / 1000
        );
        setElapsedSeconds(diff);
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsedSeconds(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentSession]);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // Active session (end_time IS NULL)
    const { data: active, error: activeErr } = await supabase
      .from('fast_sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeErr) setError(activeErr.message);
    setCurrentSession(active as FastSession | null);

    // Completed sessions (last 14)
    const { data: history } = await supabase
      .from('fast_sessions')
      .select('*')
      .eq('user_id', user.id)
      .not('end_time', 'is', null)
      .order('start_time', { ascending: false })
      .limit(14);
    setSessionHistory((history ?? []) as FastSession[]);

    // User goal
    const { data: goal } = await supabase
      .from('fasting_goals')
      .select('goal_hours')
      .eq('user_id', user.id)
      .maybeSingle();
    if (goal) setGoalHours(goal.goal_hours);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const startFast = async (): Promise<{ error?: string }> => {
    if (!user?.id) return { error: 'Not signed in' };
    if (currentSession) return { error: 'A fast is already in progress' };

    const { data, error: err } = await supabase
      .from('fast_sessions')
      .insert([{
        user_id: user.id,
        family_id: family?.id ?? null,
        goal_minutes: goalHours * 60,
      }])
      .select()
      .single();

    if (err) return { error: err.message };
    setCurrentSession(data as FastSession);
    return {};
  };

  const endFast = async (): Promise<{ error?: string }> => {
    if (!currentSession) return { error: 'No active fast' };

    const endTime = new Date().toISOString();
    const { error: err } = await supabase
      .from('fast_sessions')
      .update({ end_time: endTime })
      .eq('id', currentSession.id);

    if (err) return { error: err.message };

    const completed: FastSession = { ...currentSession, end_time: endTime };
    setSessionHistory((prev) => [completed, ...prev]);
    setCurrentSession(null);
    return {};
  };

  const setGoal = async (hours: number): Promise<{ error?: string }> => {
    if (!user?.id) return { error: 'Not signed in' };

    const { error: err } = await supabase
      .from('fasting_goals')
      .upsert({ user_id: user.id, goal_hours: hours, updated_at: new Date().toISOString() });

    if (err) return { error: err.message };
    setGoalHours(hours);

    // Keep active session goal in sync
    if (currentSession) {
      await supabase
        .from('fast_sessions')
        .update({ goal_minutes: hours * 60 })
        .eq('id', currentSession.id);
      setCurrentSession((s) => s ? { ...s, goal_minutes: hours * 60 } : s);
    }
    return {};
  };

  const value: FastingContextValue = {
    currentSession,
    sessionHistory,
    goalHours,
    elapsedSeconds,
    loading,
    error,
    startFast,
    endFast,
    setGoal,
  };

  return <FastingContext.Provider value={value}>{children}</FastingContext.Provider>;
};
