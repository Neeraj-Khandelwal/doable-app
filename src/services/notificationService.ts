/**
 * Unified notification service.
 *
 * On Android (Capacitor native) it uses:
 *   - @capacitor/local-notifications  → scheduled alarms that fire when app is closed
 *   - @capacitor/push-notifications   → FCM server-push (family nudges, etc.)
 *
 * On web it falls back to the browser Notification API (fires only while app is open).
 *
 * IMPORTANT: before local notifications work on Android you must:
 *   1. npx cap add android
 *   2. Create a Firebase project at console.firebase.google.com
 *   3. Add an Android app with package ID  com.doable.app
 *   4. Download google-services.json → place it in android/app/
 *   5. Follow Capacitor FCM setup docs to add the Google Services plugin to
 *      android/build.gradle and android/app/build.gradle
 */

import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  LocalNotifications,
  type ScheduleOptions,
} from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../supabaseClient';

let _regListener: PluginListenerHandle | null = null;
let _pushListener: PluginListenerHandle | null = null;

export const isNative = () => Capacitor.isNativePlatform();

// ── Permission ────────────────────────────────────────────────────────────────

export type NotifPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export async function getPermissionStatus(): Promise<NotifPermission> {
  if (isNative()) {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'default';
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotifPermission> {
  if (isNative()) {
    const { display } = await LocalNotifications.requestPermissions();
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'default';
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  const result = await Notification.requestPermission();
  return result;
}

// ── Immediate (in-app) notification ──────────────────────────────────────────

export async function fireImmediateNotification(
  title: string,
  body: string,
  id: number,
) {
  if (isNative()) {
    await LocalNotifications.schedule({
      notifications: [{ title, body, id, schedule: { at: new Date(Date.now() + 500) } }],
    });
  } else {
    try {
      new Notification(title, { body, icon: '/favicon.svg' });
    } catch {
      // blocked or unsupported
    }
  }
}

// ── Local notification scheduling (native only) ───────────────────────────────

/**
 * Schedule a local notification for a standalone alarm.
 *
 * @param notifId   Stable integer ID (derived from alarm UUID — see idFromUuid)
 * @param time      "HH:MM" string
 * @param label     User label (optional)
 * @param repeatDays  0-6 array (Sun=0). Empty = one-time (fires next occurrence).
 */
export async function scheduleAlarmNotification(
  notifId: number,
  time: string,
  label: string | null,
  repeatDays: number[],
) {
  if (!isNative()) return;

  const [hour, minute] = time.split(':').map(Number);
  const title = label ? `⏰ ${label}` : '⏰ Alarm';
  const body = formatTime(time);

  // Cancel any existing notification with this ID first
  await LocalNotifications.cancel({ notifications: [{ id: notifId }] });

  if (repeatDays.length === 0) {
    // One-time: fire at the next occurrence of this HH:MM
    const at = nextOccurrence(hour, minute);
    await LocalNotifications.schedule({
      notifications: [{ id: notifId, title, body, schedule: { at, allowWhileIdle: true } }],
    });
  } else {
    // Recurring: schedule one entry per repeat day (Capacitor IDs must be unique)
    const schedules: ScheduleOptions['notifications'] = repeatDays.map((day, i) => ({
      id: notifId + i,
      title,
      body,
      schedule: {
        on: { weekday: day + 1, hour, minute }, // Capacitor weekday: 1=Sun … 7=Sat
        allowWhileIdle: true,
      },
    }));
    await LocalNotifications.schedule({ notifications: schedules });
  }
}

/**
 * Cancel a scheduled alarm notification (and its day-variants for recurring).
 */
export async function cancelAlarmNotification(notifId: number, repeatDays: number[]) {
  if (!isNative()) return;
  const count = Math.max(1, repeatDays.length);
  const ids = Array.from({ length: count }, (_, i) => ({ id: notifId + i }));
  await LocalNotifications.cancel({ notifications: ids });
}

// ── Task notification action buttons ─────────────────────────────────────────

export const TASK_ACTION_TYPE_ID = 'TASK_REMINDER';

/**
 * Register the action buttons that appear on task reminder notifications.
 * Call once on app start (native only). Safe to call multiple times.
 */
export async function registerTaskNotificationActions(): Promise<void> {
  if (!isNative()) return;
  await LocalNotifications.registerActionTypes({
    types: [{
      id: TASK_ACTION_TYPE_ID,
      actions: [
        { id: 'complete', title: '✅ Mark Done', foreground: true },
        { id: 'dismiss',  title: 'Clear', destructive: true },
      ],
    }],
  });
}

/**
 * Listen for taps on task notification action buttons.
 * Returns a cleanup function — call it on component unmount.
 */
export function addTaskNotificationActionListener(
  handler: (
    actionId: string,
    extra: Record<string, string>,
    notifId: number,
  ) => void,
): () => void {
  if (!isNative()) return () => {};
  const promise = LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (event) => {
      const extra = (event.notification.extra ?? {}) as Record<string, string>;
      if (extra.type !== 'task') return;
      handler(event.actionId, extra, event.notification.id);
    },
  );
  return () => { void promise.then((h) => h.remove()); };
}

// ── Habit notification action buttons ────────────────────────────────────────

export const HABIT_ACTION_TYPE_ID = 'HABIT_REMINDER';

/**
 * Register the three action buttons that appear on habit reminder notifications.
 * Call once on app start (native only). Safe to call multiple times.
 */
export async function registerHabitNotificationActions(): Promise<void> {
  if (!isNative()) return;
  await LocalNotifications.registerActionTypes({
    types: [{
      id: HABIT_ACTION_TYPE_ID,
      actions: [
        { id: 'complete', title: '✅ Mark Done', foreground: true },
        { id: 'snooze',   title: '💤 Snooze 10 min' },
        { id: 'dismiss',  title: 'Clear', destructive: true },
      ],
    }],
  });
}

/**
 * Listen for taps on habit notification action buttons.
 * Returns a cleanup function — call it on component unmount.
 */
export function addHabitNotificationActionListener(
  handler: (
    actionId: string,
    extra: Record<string, string>,
    notifId: number,
    title: string,
    body: string,
  ) => void,
): () => void {
  if (!isNative()) return () => {};
  const promise = LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (event) => {
      const extra = (event.notification.extra ?? {}) as Record<string, string>;
      if (extra.type !== 'habit') return;
      handler(
        event.actionId,
        extra,
        event.notification.id,
        event.notification.title ?? '',
        event.notification.body ?? '',
      );
    },
  );
  return () => { void promise.then((h) => h.remove()); };
}

/**
 * Schedule a snooze notification that fires `minutes` from now,
 * reusing the same notifId (safe — original has already fired).
 */
export async function scheduleSnoozeNotification(
  notifId: number,
  title: string,
  body: string,
  extra: Record<string, string>,
  minutes: number,
): Promise<void> {
  if (!isNative()) return;
  await LocalNotifications.schedule({
    notifications: [{
      id: notifId,
      title,
      body,
      extra,
      actionTypeId: HABIT_ACTION_TYPE_ID,
      schedule: { at: new Date(Date.now() + minutes * 60 * 1000), allowWhileIdle: true },
    }],
  });
}

/**
 * Schedule a task/habit reminder notification.
 * If nudgeInterval > 0, schedules repeated notifications every nudgeInterval minutes
 * after reminderTime for up to 8 hours (or until end of day).
 *
 * Pass `extra` and `actionTypeId` to attach action buttons (habit reminders only).
 */
export async function scheduleReminderNotification(
  notifId: number,
  time: string,
  title: string,
  body: string,
  nudgeIntervalMinutes = 0,
  extra?: Record<string, string>,
  actionTypeId?: string,
  fireAt?: Date,
) {
  if (!isNative()) return;

  const [hour, minute] = time.split(':').map(Number);
  await cancelReminderNotification(notifId, nudgeIntervalMinutes);

  if (nudgeIntervalMinutes <= 0) {
    const at = fireAt ?? nextOccurrence(hour, minute);
    await LocalNotifications.schedule({
      notifications: [{ id: notifId, title, body, schedule: { at, allowWhileIdle: true }, extra, actionTypeId }],
    });
  } else {
    // Schedule the initial + nudge notifications for today (up to 8 nudges)
    const notifications: ScheduleOptions['notifications'] = [];
    const startMinutes = hour * 60 + minute;
    for (let i = 0; i <= 8; i++) {
      const totalMinutes = startMinutes + i * nudgeIntervalMinutes;
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      if (h >= 24) break;
      const at = nextOccurrence(h, m);
      notifications.push({
        id: notifId + i,
        title: i === 0 ? title : `📳 ${title}`,
        body,
        schedule: { at, allowWhileIdle: true },
        extra,
        actionTypeId,
      });
    }
    await LocalNotifications.schedule({ notifications });
  }
}

export async function cancelReminderNotification(notifId: number, nudgeIntervalMinutes = 0) {
  if (!isNative()) return;
  const count = nudgeIntervalMinutes > 0 ? 9 : 1;
  const ids = Array.from({ length: count }, (_, i) => ({ id: notifId + i }));
  await LocalNotifications.cancel({ notifications: ids });
}

// ── FCM Push Notifications ────────────────────────────────────────────────────

/**
 * Register this device for FCM push notifications and persist the token to
 * Supabase so the Edge Function can target it.
 *
 * Call this once on app start when the user is logged in.
 *
 * Requires:
 *   - google-services.json in android/app/
 *   - SUPABASE_URL + SUPABASE_ANON_KEY env vars (already configured)
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  if (!isNative()) return;

  try {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive !== 'granted') {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== 'granted') return;

    await PushNotifications.register();

    // Remove old listeners before re-registering to prevent duplicates on re-login
    _regListener?.remove();  _regListener = null;
    _pushListener?.remove(); _pushListener = null;

    // Token arrives asynchronously
    _regListener = await PushNotifications.addListener('registration', async ({ value: token }) => {
      await supabase.from('fcm_tokens').upsert(
        { user_id: userId, token, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    });

    // Handle foreground push messages
    _pushListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      void fireImmediateNotification(
        notification.title ?? 'Doable',
        notification.body ?? '',
        Date.now() & 0x7fffffff,
      );
    });
  } catch (err) {
    console.warn('Push notification registration failed:', err);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the next Date when the clock will show HH:MM (today or tomorrow). */
function nextOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(hour, minute, 0, 0);
  if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Converts the first 8 hex chars of a UUID into a positive 32-bit integer.
 * Stable and collision-resistant enough for notification IDs within one user's data.
 * We multiply by a prime to spread day-variant IDs (notifId+0, notifId+1 … notifId+6)
 * far from adjacent alarms.
 */
export function idFromUuid(uuid: string): number {
  const hex = uuid.replace(/-/g, '').slice(0, 8);
  return (parseInt(hex, 16) & 0x7fffffff & ~0x0f); // bottom 4 bits reserved for day variants
}
