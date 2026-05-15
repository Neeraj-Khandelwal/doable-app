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
import {
  scheduleAlarmNotification,
  cancelAlarmNotification,
  idFromUuid,
} from '../services/notificationService';
import {
  isAndroidSystemClockAvailable,
  openSystemClockSetAlarm,
} from '../services/androidClockAlarm';

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

type AlarmDeliveryInput = Pick<Alarm, 'id' | 'time' | 'label' | 'repeat_days'>;

/**
 * Schedules the saved alarm through Android Clock when available, falling back to local notifications.
 * Call after a successful alarm create/update with the persisted row and optional previous repeat days.
 * Returns after either native Clock is opened or the notification fallback has been scheduled.
 */
async function scheduleAlarmDelivery(
  alarm: AlarmDeliveryInput,
  previousRepeatDays?: RepeatDay[],
): Promise<void> {
  const notifId = idFromUuid(alarm.id);

  if (isAndroidSystemClockAvailable()) {
    try {
      const result = await openSystemClockSetAlarm(
        alarm.time,
        alarm.label ?? null,
        alarm.repeat_days ?? [],
      );

      if (result.success) {
        await cancelAlarmNotification(notifId, previousRepeatDays ?? alarm.repeat_days ?? []);
        return;
      }

      console.warn('Android Clock alarm creation failed; falling back to local notification:', result.message);
    } catch (err) {
      console.warn('Android Clock alarm creation threw; falling back to local notification:', err);
    }
  }

  if (previousRepeatDays !== undefined) {
    await cancelAlarmNotification(notifId, previousRepeatDays);
  }

  await scheduleAlarmNotification(
    notifId,
    alarm.time,
    alarm.label ?? null,
    alarm.repeat_days ?? [],
  );
}

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
    const { data: created, error: err } = await supabase
      .from('alarms')
      .insert([
        {
          user_id: user.id,
          time: data.time,
          label: data.label ?? null,
          enabled: data.enabled ?? true,
          repeat_days: data.repeat_days ?? [],
          sound: data.sound ?? 'default',
        },
      ])
      .select('*')
      .single();
    if (err) return { error: err.message };
    await fetchAlarms();

    if (created && (data.enabled ?? true)) {
      await scheduleAlarmDelivery(created as AlarmDeliveryInput);
    }
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

    // Re-schedule or cancel local notification
    const updated = alarms.find((a) => a.id === id);
    if (updated) {
      const merged = { ...updated, ...data };
      const notifId = idFromUuid(id);
      if (merged.enabled) {
        await scheduleAlarmDelivery(merged, updated.repeat_days ?? []);
      } else {
        await cancelAlarmNotification(notifId, updated.repeat_days ?? []);
      }
    }
    return {};
  };

  const deleteAlarm = async (id: string): Promise<{ error?: string }> => {
    const alarm = alarms.find((a) => a.id === id);
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    const { error: err } = await supabase.from('alarms').delete().eq('id', id);
    if (err) {
      void fetchAlarms();
      return { error: err.message };
    }
    if (alarm) {
      void cancelAlarmNotification(idFromUuid(id), alarm.repeat_days ?? []);
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
