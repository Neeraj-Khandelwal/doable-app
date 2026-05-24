import { useState, useEffect } from 'react';
import type { HabitPointsConfig } from '../../utils/familyModels';
import { DEFAULT_HABIT_POINTS_CONFIG } from '../../utils/familyModels';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  current: HabitPointsConfig;
  onSave: (config: HabitPointsConfig) => Promise<void>;
}

export default function HabitPointsConfigModal({ isOpen, onClose, current, onSave }: Props) {
  const [completionPts, setCompletionPts] = useState(String(current.completion_points));
  const [streakDays, setStreakDays] = useState(String(current.streak_milestone));
  const [streakBonus, setStreakBonus] = useState(String(current.streak_bonus_points));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCompletionPts(String(current.completion_points));
      setStreakDays(String(current.streak_milestone));
      setStreakBonus(String(current.streak_bonus_points));
      setError('');
    }
  }, [isOpen, current]);

  if (!isOpen) return null;

  const parse = (val: string, min: number, max: number): number | null => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < min || n > max) return null;
    return n;
  };

  const handleSave = async () => {
    const cp = parse(completionPts, 1, 100);
    const sd = parse(streakDays, 2, 100);
    const sb = parse(streakBonus, 1, 500);

    if (cp === null) { setError('Completion points must be between 1 and 100.'); return; }
    if (sd === null) { setError('Streak days must be between 2 and 100.'); return; }
    if (sb === null) { setError('Streak bonus must be between 1 and 500.'); return; }

    setSaving(true);
    setError('');
    await onSave({ completion_points: cp, streak_milestone: sd, streak_bonus_points: sb });
    setSaving(false);
    onClose();
  };

  const handleReset = () => {
    setCompletionPts(String(DEFAULT_HABIT_POINTS_CONFIG.completion_points));
    setStreakDays(String(DEFAULT_HABIT_POINTS_CONFIG.streak_milestone));
    setStreakBonus(String(DEFAULT_HABIT_POINTS_CONFIG.streak_bonus_points));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">Habit Points Settings</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink text-2xl leading-none">×</button>
        </div>

        <p className="text-sm text-ink-4 -mt-2">Configure how many points kids earn from habits. Changes apply to all future completions.</p>

        {/* Completion points */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-ink">
            Points per habit completion
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="100"
              value={completionPts}
              onChange={(e) => setCompletionPts(e.target.value)}
              className="w-24 px-3 py-2.5 border border-line rounded-xl text-sm text-center font-bold text-ink focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
            />
            <span className="text-sm text-ink-3">pts each time a kid completes a habit</span>
          </div>
        </div>

        {/* Streak milestone */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-ink">
            Streak bonus — every
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="2"
              max="100"
              value={streakDays}
              onChange={(e) => setStreakDays(e.target.value)}
              className="w-24 px-3 py-2.5 border border-line rounded-xl text-sm text-center font-bold text-ink focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
            />
            <span className="text-sm text-ink-3">days in a row</span>
          </div>
        </div>

        {/* Streak bonus points */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-ink">
            Streak bonus points
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="500"
              value={streakBonus}
              onChange={(e) => setStreakBonus(e.target.value)}
              className="w-24 px-3 py-2.5 border border-line rounded-xl text-sm text-center font-bold text-ink focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
            />
            <span className="text-sm text-ink-3">bonus pts awarded at streak</span>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-plum-soft rounded-xl px-4 py-3 text-sm text-lavender font-medium space-y-1">
          <p>🔥 Complete a habit → <strong>+{completionPts || '?'} pt{Number(completionPts) !== 1 ? 's' : ''}</strong></p>
          <p>⭐ {streakDays || '?'}-day streak → <strong>+{streakBonus || '?'} bonus pt{Number(streakBonus) !== 1 ? 's' : ''}</strong></p>
        </div>

        {error && <p className="text-xs text-rose font-medium">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl border-2 border-line text-ink-3 text-sm font-semibold hover:border-ink-3 transition-colors"
          >
            Reset defaults
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-lavender text-white text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

      </div>
    </div>
  );
}
