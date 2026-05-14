import { useEffect, useState } from 'react';
import type { Alarm, AlarmSound, RepeatDay } from '../../utils/alarmModels';
import { ALL_DAYS, DAY_LABELS } from '../../utils/alarmModels';

type Props = {
  isOpen: boolean;
  alarm: Alarm | null;
  onSave: (data: {
    time: string;
    label: string;
    enabled: boolean;
    repeat_days: RepeatDay[];
    sound: AlarmSound;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
};

const SOUND_OPTIONS: { value: AlarmSound; label: string; icon: string }[] = [
  { value: 'default', label: 'Default', icon: '🔔' },
  { value: 'bell', label: 'Bell', icon: '🛎️' },
  { value: 'chime', label: 'Chime', icon: '🎵' },
  { value: 'silent', label: 'Silent', icon: '🔕' },
];

export default function AlarmModal({ isOpen, alarm, onSave, onDelete, onClose }: Props) {
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [repeatDays, setRepeatDays] = useState<RepeatDay[]>([]);
  const [sound, setSound] = useState<AlarmSound>('default');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (alarm) {
      setTime(alarm.time);
      setLabel(alarm.label ?? '');
      setEnabled(alarm.enabled);
      setRepeatDays(alarm.repeat_days ?? []);
      setSound(alarm.sound ?? 'default');
    } else {
      setTime('07:00');
      setLabel('');
      setEnabled(true);
      setRepeatDays([]);
      setSound('default');
    }
    setError('');
  }, [isOpen, alarm]);

  const toggleDay = (day: RepeatDay) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!time) {
      setError('Please set a time.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ time, label, enabled, repeat_days: repeatDays, sound });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save alarm');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl px-5 pt-5 pb-8 shadow-xl">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {alarm ? 'Edit Alarm' : 'New Alarm'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* Time picker */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-2xl font-bold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-lavender"
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Morning workout"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender"
            />
          </div>

          {/* Repeat days */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Repeat
            </label>
            <div className="flex gap-1.5">
              {ALL_DAYS.map((day) => {
                const active = repeatDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      active
                        ? 'bg-lavender text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {repeatDays.length === 0 ? 'One-time alarm' : `Repeats on ${repeatDays.length === 7 ? 'every day' : 'selected days'}`}
            </p>
          </div>

          {/* Sound */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Sound
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SOUND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSound(opt.value)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    sound === opt.value
                      ? 'border-lavender bg-lavender/10 text-lavender'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Alarm enabled</span>
            <button
              onClick={() => setEnabled((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                enabled ? 'bg-lavender' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {error && <p className="text-xs text-rose font-medium">{error}</p>}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full py-3 bg-lavender text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving…' : alarm ? 'Save Changes' : 'Add Alarm'}
            </button>

            {onDelete && (
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="w-full py-3 bg-rose/10 text-rose font-bold rounded-xl hover:bg-rose/20 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete Alarm'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
