import { useEffect, useMemo, useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useHabitContext } from '../context/HabitContext';
import { useAlarmContext } from '../context/AlarmContext';
import { useAuthContext } from '../context/AuthContext';
import { CATEGORY_ICONS } from '../utils/taskModels';
import { isScheduledToday, todayStr } from '../utils/habitModels';
import { formatRepeatDays, alarmFiresToday } from '../utils/alarmModels';
import type { Alarm } from '../utils/alarmModels';
import { useNotifications, alarmFiredKey, formatTime } from '../hooks/useNotifications';
import AlarmModal from '../components/alarms/AlarmModal';
import {
  scheduleReminderNotification,
  cancelReminderNotification,
  registerForPushNotifications,
  idFromUuid,
} from '../services/notificationService';
import { isAndroidSystemClockAvailable } from '../services/androidClockAlarm';

type ReminderItem = {
  id: string;
  type: 'task' | 'habit';
  title: string;
  icon: string;
  reminderTime: string;
  reminderType: string;
  nudgeInterval?: number;
  isCompleted: boolean;
};

function ReminderTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    notification: { label: '🔔 Notify', color: 'bg-sky/15 text-sky' },
    alarm:        { label: '⏰ Alarm',  color: 'bg-rose/15 text-rose' },
    nudge:        { label: '📳 Nudge',  color: 'bg-amber/15 text-amber' },
  };
  const style = map[type] ?? map.notification;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.color}`}>
      {style.label}
    </span>
  );
}

function ReminderRow({ item }: { item: ReminderItem }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-opacity ${
        item.isCompleted
          ? 'bg-gray-50 border-gray-100 opacity-60'
          : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex-shrink-0 w-16 text-center">
        <span className={`text-xs font-bold ${item.isCompleted ? 'text-gray-400' : 'text-gray-700'}`}>
          {formatTime(item.reminderTime)}
        </span>
      </div>
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
          item.type === 'habit' ? 'bg-mint/15' : 'bg-lavender/15'
        }`}
      >
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${item.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            item.type === 'habit' ? 'bg-mint/15 text-mint' : 'bg-lavender/15 text-lavender'
          }`}>
            {item.type === 'habit' ? 'Habit' : 'Task'}
          </span>
          <ReminderTypeBadge type={item.reminderType} />
          {item.nudgeInterval && (
            <span className="text-xs text-gray-400">every {item.nudgeInterval} min</span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {item.isCompleted ? (
          <span className="text-mint text-lg">✓</span>
        ) : (
          <span className="w-5 h-5 rounded-full border-2 border-gray-200 inline-block" />
        )}
      </div>
    </div>
  );
}

function StandaloneAlarmRow({
  alarm,
  onEdit,
  onToggle,
}: {
  alarm: Alarm;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const repeatLabel = formatRepeatDays(alarm.repeat_days ?? []);
  const soundIcons: Record<string, string> = {
    default: '🔔',
    bell: '🛎️',
    chime: '🎵',
    silent: '🔕',
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm cursor-pointer transition-opacity ${
        alarm.enabled ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'
      }`}
      onClick={onEdit}
    >
      {/* Time */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-extrabold ${alarm.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            {formatTime(alarm.time)}
          </span>
          <span className="text-xs text-gray-400">{soundIcons[alarm.sound ?? 'default']}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {alarm.label && (
            <span className="text-sm text-gray-600 truncate">{alarm.label}</span>
          )}
          <span className="text-xs text-gray-400">{repeatLabel}</span>
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          alarm.enabled ? 'bg-lavender' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            alarm.enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function Alarms() {
  const { tasks } = useTaskContext();
  const { habits, getTodayCount } = useHabitContext();
  const { alarms, createAlarm, updateAlarm, deleteAlarm, toggleAlarm } = useAlarmContext();
  const { user } = useAuthContext();
  const { permission, requestPermission, fire, isNative } = useNotifications();
  const isAndroidClock = isAndroidSystemClockAvailable();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);

  const today = todayStr();

  // ── Register FCM push on native ──────────────────────────────────────────────
  useEffect(() => {
    if (isNative && user?.id) {
      void registerForPushNotifications(user.id);
    }
  }, [isNative, user?.id]);

  // ── Reminder items from tasks + habits ──────────────────────────────────────
  const allReminders = useMemo<ReminderItem[]>(() => {
    const taskItems: ReminderItem[] = tasks
      .filter((t) => !!t.reminder_time && !t.completed_at)
      .map((t) => ({
        id: t.id,
        type: 'task',
        title: t.title,
        icon: CATEGORY_ICONS[t.category],
        reminderTime: t.reminder_time!,
        reminderType: t.reminder_type ?? 'notification',
        nudgeInterval: t.nudge_interval ?? undefined,
        isCompleted: !!t.completed_at,
      }));

    const habitItems: ReminderItem[] = habits
      .filter((h) => !!h.reminder_time && isScheduledToday(h))
      .map((h) => ({
        id: h.id,
        type: 'habit',
        title: h.title,
        icon: h.icon,
        reminderTime: h.reminder_time!,
        reminderType: 'notification',
        isCompleted: getTodayCount(h.id, 'me') >= h.target_count,
      }));

    return [...taskItems, ...habitItems].sort((a, b) =>
      a.reminderTime.localeCompare(b.reminderTime)
    );
  }, [tasks, habits, getTodayCount]);

  const nudgeReminders = allReminders.filter((r) => r.reminderType === 'nudge');
  const regularReminders = allReminders.filter((r) => r.reminderType !== 'nudge');
  const activeReminders = regularReminders.filter((r) => !r.isCompleted);
  const doneReminders = regularReminders.filter((r) => r.isCompleted);

  // ── Schedule local notifications for task/habit reminders (native only) ────
  useEffect(() => {
    if (!isNative || permission !== 'granted') return;
    allReminders.forEach((item) => {
      if (item.isCompleted) {
        void cancelReminderNotification(idFromUuid(item.id), item.nudgeInterval ?? 0);
        return;
      }
      if (isAndroidClock && item.type === 'task' && item.reminderType === 'alarm') {
        void cancelReminderNotification(idFromUuid(item.id), item.nudgeInterval ?? 0);
        return;
      }
      void scheduleReminderNotification(
        idFromUuid(item.id),
        item.reminderTime,
        `${item.icon} ${item.title}`,
        item.type === 'habit' ? 'Time for your habit!' : "Don't forget this task!",
        item.nudgeInterval ?? 0,
      );
    });
  }, [isNative, isAndroidClock, permission, allReminders]);

  // ── Notification polling (tasks + habits) — web only ────────────────────────
  useEffect(() => {
    if (isNative || permission !== 'granted') return;

    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      allReminders.forEach((item) => {
        if (item.isCompleted || item.reminderTime !== hhmm) return;
        const key = alarmFiredKey(item.id, today);
        if (localStorage.getItem(key)) return;
        fire(
          `${item.icon} ${item.title}`,
          item.type === 'habit' ? 'Time for your habit!' : "Don't forget this task!",
          item.id
        );
        localStorage.setItem(key, '1');
      });

      nudgeReminders.forEach((item) => {
        if (item.isCompleted || !item.nudgeInterval) return;
        const [rh, rm] = item.reminderTime.split(':').map(Number);
        const reminderMinutes = rh * 60 + rm;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (currentMinutes < reminderMinutes) return;
        const elapsed = currentMinutes - reminderMinutes;
        if (elapsed % item.nudgeInterval !== 0) return;
        const key = alarmFiredKey(`${item.id}-nudge`, `${today}-${currentMinutes}`);
        if (localStorage.getItem(key)) return;
        fire(`📳 ${item.title}`, `Nudge reminder — ${item.nudgeInterval} min interval`, item.id);
        localStorage.setItem(key, '1');
      });

      // Standalone alarms
      alarms.filter(alarmFiresToday).forEach((alarm) => {
        if (alarm.time !== hhmm) return;
        const key = alarmFiredKey(`standalone-${alarm.id}`, today);
        if (localStorage.getItem(key)) return;
        fire(
          `⏰ ${alarm.label ?? 'Alarm'}`,
          formatTime(alarm.time),
          `standalone-${alarm.id}`
        );
        localStorage.setItem(key, '1');
      });
    };

    check();
    const interval = setInterval(check, 15_000);
    return () => clearInterval(interval);
  }, [permission, allReminders, nudgeReminders, alarms, today, fire]);

  const handleOpenAdd = () => {
    setEditingAlarm(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (alarm: Alarm) => {
    setEditingAlarm(alarm);
    setModalOpen(true);
  };

  const handleSave = async (data: {
    time: string;
    label: string;
    enabled: boolean;
    repeat_days: typeof editingAlarm extends null ? never : Alarm['repeat_days'];
    sound: Alarm['sound'];
  }) => {
    if (editingAlarm) {
      const result = await updateAlarm(editingAlarm.id, data);
      if (result.error) throw new Error(result.error);
    } else {
      const result = await createAlarm(data);
      if (result.error) throw new Error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!editingAlarm) return;
    const result = await deleteAlarm(editingAlarm.id);
    if (result.error) throw new Error(result.error);
  };

  const totalCount = alarms.length + allReminders.length;

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Alarms</h1>
        <span className="text-sm text-gray-500">{totalCount} total</span>
      </div>

      {/* Notification permission banner */}
      {permission === 'default' && (
        <div className="bg-sky/10 border border-sky/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🔔</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Enable notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Allow Doable to notify you when alarms and reminders are due.
            </p>
            <button
              onClick={() => void requestPermission()}
              className="mt-2 px-4 py-1.5 bg-sky text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Allow notifications
            </button>
          </div>
        </div>
      )}

      {permission === 'denied' && (
        <div className="bg-rose/10 border border-rose/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🚫</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Notifications blocked</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Enable notifications for this site in your browser settings to receive alarms.
            </p>
          </div>
        </div>
      )}

      {permission === 'granted' && (
        <div className="bg-mint/10 border border-mint/30 rounded-xl p-3 flex items-center gap-2">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium text-gray-700">
            {isAndroidClock
              ? 'Android Clock integration enabled — standalone alarms open in Clock to confirm.'
              : isNative
              ? 'Notifications enabled — alarms fire even when the app is closed.'
              : 'Notifications enabled — alarms fire while the app is open.'}
          </p>
        </div>
      )}

      {/* ── Standalone Alarms ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            ⏰ Alarms ({alarms.length})
          </h2>
          <button
            onClick={handleOpenAdd}
            className="text-xs font-semibold text-lavender hover:opacity-80"
          >
            + Add
          </button>
        </div>

        {alarms.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
            <p className="text-gray-400 text-sm">No alarms set</p>
            <p className="text-xs text-gray-400 mt-1">Tap + Add to create one</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alarms.map((alarm) => (
              <StandaloneAlarmRow
                key={alarm.id}
                alarm={alarm}
                onEdit={() => handleOpenEdit(alarm)}
                onToggle={() => void toggleAlarm(alarm.id)}
              />
            ))}
          </div>
        )}
        {isAndroidClock && (
          <p className="text-xs text-gray-400 mt-3">
            Saving or editing an alarm opens your phone Clock app with the time and repeat days prefilled.
            Removing it in Doable will not remove an alarm you already confirmed in Clock.
          </p>
        )}
      </section>

      {/* ── Task & Habit Reminders ──────────────────────────────────────────────── */}
      {allReminders.length === 0 && alarms.length === 0 && (
        <div className="text-center py-10">
          <div className="text-5xl mb-4">🔕</div>
          <p className="text-gray-500 font-medium">No alarms or reminders</p>
          <p className="text-sm text-gray-400 mt-1">
            Tap + Add to create an alarm, or set a reminder on any task or habit.
          </p>
        </div>
      )}

      {activeReminders.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            📋 Today's Reminders ({activeReminders.length})
          </h2>
          <div className="space-y-2">
            {activeReminders.map((item) => (
              <ReminderRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {nudgeReminders.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            📳 Nudge Reminders ({nudgeReminders.length})
          </h2>
          <div className="space-y-2">
            {nudgeReminders.map((item) => (
              <ReminderRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {doneReminders.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            ✅ Done Today ({doneReminders.length})
          </h2>
          <div className="space-y-2">
            {doneReminders.map((item) => (
              <ReminderRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {totalCount > 0 && !isNative && (
        <p className="text-xs text-gray-400 text-center px-4">
          Alarms fire while the app is open. Install the Android app for background alerts.
        </p>
      )}

      {/* FAB */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-24 right-4 w-14 h-14 bg-lavender text-white rounded-full shadow-lg text-2xl font-bold flex items-center justify-center hover:opacity-90 transition-all active:scale-95 z-40"
        aria-label="Add alarm"
      >
        +
      </button>

      {/* Modal */}
      <AlarmModal
        isOpen={modalOpen}
        alarm={editingAlarm}
        onSave={handleSave}
        onDelete={editingAlarm ? handleDelete : undefined}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
