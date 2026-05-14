import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from './AuthContext';
import type { Alarm, AlarmSound, RepeatDay } from '../utils/alarmModels';

type CreateAlarmInput = {
  time: string;
  label?: string;
  enabled?: boolean;
  repeat_days?: RepeatDay[];
  sound?: AlarmSound;
};

type AlarmContextValue = {
  alarms: Alarm[];
  loading: boolean;
  error: string | null;
  createAlarm: (data: CreateAlarmInput) => Promise<{ error?: string }>;
  updateAlarm: (id: string, data: Partial<CreateAlarmInput>) => Promise<{ error?: string }>;
  deleteAlarm: (id: string) => Promise<{ error?: string }>;
  toggleAlarm: (id: string) => Promise<{ error?: string }>;
};

const AlarmContext = createContext<AlarmContextValue | undefined>(undefined);

export const useAlarmContext = () => {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error('useAlarmContext must be used within AlarmProvider');
  return ctx;
};

export const AlarmProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();

  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlarms = useCallback(async () => {
    if (!user?.id) {
      setAlarms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('alarms')
      .select('*')
      .eq('user_id', user.id)
      .order('time', { ascending: true });

    if (err) setError(err.message);
    setAlarms((data ?? []) as Alarm[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void fetchAlarms();
  }, [fetchAlarms]);

  const createAlarm = async (data: CreateAlarmInput): Promise<{ error?: string }> => {
    if (!user?.id) return { error: 'Not authenticated' };
    const { error: err } = await supabase.from('alarms').insert([
      {
        user_id: user.id,
        time: data.time,
        label: data.label ?? null,
        enabled: data.enabled ?? true,
        repeat_days: data.repeat_days ?? [],
        sound: data.sound ?? 'default',
      },
    ]);
    if (err) return { error: err.message };
    await fetchAlarms();
    return {};
  };

  const updateAlarm = async (
    id: string,
    data: Partial<CreateAlarmInput>
  ): Promise<{ error?: string }> => {
    const updates: Record<string, unknown> = {};
    if (data.time !== undefined) updates.time = data.time;
    if (data.label !== undefined) updates.label = data.label;
    if (data.enabled !== undefined) updates.enabled = data.enabled;
    if (data.repeat_days !== undefined) updates.repeat_days = data.repeat_days;
    if (data.sound !== undefined) updates.sound = data.sound;
    updates.updated_at = new Date().toISOString();

    const { error: err } = await supabase.from('alarms').update(updates).eq('id', id);
    if (err) return { error: err.message };

    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...(data as Partial<Alarm>) } : a))
    );
    return {};
  };

  const deleteAlarm = async (id: string): Promise<{ error?: string }> => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    const { error: err } = await supabase.from('alarms').delete().eq('id', id);
    if (err) {
      void fetchAlarms();
      return { error: err.message };
    }
    return {};
  };

  const toggleAlarm = async (id: string): Promise<{ error?: string }> => {
    const alarm = alarms.find((a) => a.id === id);
    if (!alarm) return { error: 'Alarm not found' };
    return updateAlarm(id, { enabled: !alarm.enabled });
  };

  const value: AlarmContextValue = {
    alarms,
    loading,
    error,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
  };

  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>;
};
