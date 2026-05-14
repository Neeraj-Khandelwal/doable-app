import { useState, useCallback, useEffect } from 'react';
import {
  getPermissionStatus,
  requestNotificationPermission,
  fireImmediateNotification,
  isNative,
  type NotifPermission,
} from '../services/notificationService';

export type { NotifPermission };

export function useNotifications() {
  const [permission, setPermission] = useState<NotifPermission>('default');

  // Load initial permission state (async on native)
  useEffect(() => {
    void getPermissionStatus().then(setPermission);
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  }, []);

  const fire = useCallback(
    (title: string, body: string, _tag?: string) => {
      if (permission !== 'granted') return;
      // On native, generate a stable numeric ID from the tag string
      const id = _tag
        ? Math.abs(_tag.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0))
        : (Date.now() & 0x7fffffff);
      void fireImmediateNotification(title, body, id);
    },
    [permission]
  );

  return { permission, requestPermission, fire, isNative: isNative() };
}

// Key used in localStorage to track which alarms fired today (web-only fallback)
export function alarmFiredKey(itemId: string, date: string) {
  return `doable-notified-${itemId}-${date}`;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}
