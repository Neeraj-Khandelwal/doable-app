import { useState, useEffect, useCallback } from 'react';
import { getPermissionStatus, requestNotificationPermission } from '../services/notificationService';

export type PermStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface AppPermissions {
  notifications: PermStatus;
  microphone: PermStatus;
  camera: PermStatus;
}

async function queryPermission(name: string): Promise<PermStatus> {
  if (!navigator.permissions) return 'prompt';
  try {
    const status = await navigator.permissions.query({ name: name as PermissionName });
    if (status.state === 'granted') return 'granted';
    if (status.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

export function useAppPermissions() {
  const [permissions, setPermissions] = useState<AppPermissions>({
    notifications: 'prompt',
    microphone: 'prompt',
    camera: 'prompt',
  });
  const [requesting, setRequesting] = useState<keyof AppPermissions | null>(null);

  const refresh = useCallback(async () => {
    const notifRaw = await getPermissionStatus();
    const notif: PermStatus =
      notifRaw === 'unsupported' ? 'unsupported' :
      notifRaw === 'granted' ? 'granted' :
      notifRaw === 'denied' ? 'denied' : 'prompt';

    const [mic, cam] = await Promise.all([
      queryPermission('microphone'),
      queryPermission('camera'),
    ]);
    setPermissions({ notifications: notif, microphone: mic, camera: cam });
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const requestPermission = async (type: keyof AppPermissions) => {
    setRequesting(type);
    try {
      if (type === 'notifications') {
        await requestNotificationPermission();
      } else if (type === 'microphone') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch { /* denied */ }
      } else if (type === 'camera') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch { /* denied */ }
      }
    } finally {
      await refresh();
      setRequesting(null);
    }
  };

  return { permissions, requesting, requestPermission, refresh };
}
