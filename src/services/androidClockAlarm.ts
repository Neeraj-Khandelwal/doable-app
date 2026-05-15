import { Capacitor } from '@capacitor/core';
import { CapgoAlarm } from '@capgo/capacitor-alarm';
import type { RepeatDay } from '../utils/alarmModels';

type SystemClockAlarmResult = {
  success: boolean;
  message?: string;
};

/**
 * Returns whether Doable should call the Android system Clock integration.
 * Call this before `openSystemClockSetAlarm()` to keep web and iOS on notification flows.
 * Returns true only inside the native Android Capacitor runtime.
 */
export function isAndroidSystemClockAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Opens Android's system Clock app with a prefilled alarm request.
 * Call with an HH:mm time, optional label, and Doable repeat days where 0=Sun and 6=Sat.
 * Returns the native action result; recurring days are passed through the patched `repeatDays` option.
 */
export async function openSystemClockSetAlarm(
  timeHHmm: string,
  label: string | null,
  repeatDays: RepeatDay[],
): Promise<SystemClockAlarmResult> {
  if (!isAndroidSystemClockAvailable()) {
    return { success: false, message: 'Android system Clock is unavailable on this platform.' };
  }

  const [hourText, minuteText] = timeHHmm.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { success: false, message: `Invalid alarm time: ${timeHHmm}` };
  }

  return CapgoAlarm.createAlarm({
    hour,
    minute,
    label: label?.trim() || undefined,
    repeatDays: repeatDays.length > 0 ? repeatDays : undefined,
    skipUi: false,
    vibrate: true,
  });
}
