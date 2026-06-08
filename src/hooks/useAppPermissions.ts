import { useState, useEffect, useCallback } from 'react';
import { getPermissionStatus, requestNotificationPermission } from '../services/notificationService';

export type PermStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface AppPermissions {
  notifications: PermStatus;
  microphone: PermStatus;
  camera: PermStatus;
}

/**
 * Check mic/camera status without activating hardware.
 * 1. Try Permissions API (works on desktop Chrome/Firefox).
 * 2. Fall back to enumerateDevices — device labels are non-empty only when
 *    the permission is already granted. Reliable on Android Capacitor WebView
 *    where navigator.permissions.query() always returns 'prompt'.
 */
async function queryMediaPermission(kind: 'microphone' | 'camera'): Promise<PermStatus> {
  const permName = kind === 'microphone' ? 'microphone' : 'camera';
  const deviceKind = kind === 'microphone' ? 'audioinput' : 'videoinput';

  if (navigator.permissions) {
    try {
      const result = await navigator.permissions.query({ name: permName as PermissionName });
      if (result.state === 'granted') return 'granted';
      if (result.state === 'denied') return 'denied';
    } catch { /* API unsupported on this platform */ }
  }

  // Fallback: enumerateDevices — labels only populate after permission is granted
  if (navigator.mediaDevices?.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasLabel = devices.some((d) => d.kind === deviceKind && d.label !== '');
      if (hasLabel) return 'granted';
    } catch { /* ignore */ }
  }

  return 'prompt';
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
      queryMediaPermission('microphone'),
      queryMediaPermission('camera'),
    ]);
    setPermissions({ notifications: notif, microphone: mic, camera: cam });
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const requestPermission = async (type: keyof AppPermissions) => {
    setRequesting(type);
    try {
      if (type === 'notifications') {
        await requestNotificationPermission();
        await refresh();
      } else if (type === 'microphone') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          // getUserMedia succeeded — permission is definitely granted
          setPermissions((prev) => ({ ...prev, microphone: 'granted' }));
        } catch {
          await refresh(); // re-query to pick up 'denied' if blocked
        }
      } else if (type === 'camera') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((t) => t.stop());
          setPermissions((prev) => ({ ...prev, camera: 'granted' }));
        } catch {
          await refresh();
        }
      }
    } finally {
      setRequesting(null);
    }
  };

  return { permissions, requesting, requestPermission, refresh };
}
