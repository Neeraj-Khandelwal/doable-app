import { useState, useCallback } from 'react';

export type NotifPermission = 'granted' | 'denied' | 'default' | 'unsupported';

function getCurrentPermission(): NotifPermission {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotifPermission>(getCurrentPermission);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const fire = useCallback(
    (title: string, body: string, tag?: string) => {
      if (permission !== 'granted') return;
      try {
        new Notification(title, { body, tag, icon: '/favicon.ico' });
      } catch {
        // Notifications blocked or in a context that doesn't support it
      }
    },
    [permission]
  );

  return { permission, requestPermission, fire };
}

// Key used in localStorage to track which alarms fired today
export function alarmFiredKey(itemId: string, date: string) {
  return `doable-notified-${itemId}-${date}`;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}
