import { useState, useEffect } from 'react';
import type { HabitPointsConfig } from '../../utils/familyModels';
import { DEFAULT_HABIT_POINTS_CONFIG } from '../../utils/familyModels';
import type { RatingOption } from '../../utils/taskModels';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  habitConfig: HabitPointsConfig;
  onSaveHabitConfig: (config: HabitPointsConfig) => Promise<void>;
  ratingOptions: RatingOption[];
  onSaveRatingOptions: (options: RatingOption[]) => Promise<void>;
}

type Tab = 'habits' | 'ratings';

const EMOJI_SUGGESTIONS = ['🌟', '👍', '😐', '👎', '🔥', '💪', '😊', '😢', '🎉', '❤️', '⭐', '😎'];

export default function RewardsSettingsModal({
  isOpen, onClose, habitConfig, onSaveHabitConfig, ratingOptions, onSaveRatingOptions,
}: Props) {
  const [tab, setTab] = useState<Tab>('habits');

  // Habit points state
  const [completionPts, setCompletionPts] = useState(String(habitConfig.completion_points));
  const [streakDays, setStreakDays] = useState(String(habitConfig.streak_milestone));
  const [streakBonus, setStreakBonus] = useState(String(habitConfig.streak_bonus_points));
  const [habitSaving, setHabitSaving] = useState(false);
  const [habitError, setHabitError] = useState('');

  // Ratings state
  const [options, setOptions] = useState<RatingOption[]>([]);
  const [ratingsSaving, setRatingsSaving] = useState(false);
  const [ratingsError, setRatingsError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCompletionPts(String(habitConfig.completion_points));
      setStreakDays(String(habitConfig.streak_milestone));
      setStreakBonus(String(habitConfig.streak_bonus_points));
      setHabitError('');
      setOptions(ratingOptions.map((o) => ({ ...o })));
      setRatingsError('');
    }
  }, [isOpen, habitConfig, ratingOptions]);

  if (!isOpen) return null;

  const parse = (val: string, min: number, max: number): number | null => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < min || n > max) return null;
    return n;
  };

  const handleSaveHabits = async () => {
    const cp = parse(completionPts, 1, 100);
    const sd = parse(streakDays, 2, 100);
    const sb = parse(streakBonus, 1, 500);
    if (cp === null) { setHabitError('Completion points must be 1–100.'); return; }
    if (sd === null) { setHabitError('Streak days must be 2–100.'); return; }
    if (sb === null) { setHabitError('Streak bonus must be 1–500.'); return; }
    setHabitSaving(true);
    setHabitError('');
    await onSaveHabitConfig({ completion_points: cp, streak_milestone: sd, streak_bonus_points: sb });
    setHabitSaving(false);
    onClose();
  };

  const handleResetHabits = () => {
    setCompletionPts(String(DEFAULT_HABIT_POINTS_CONFIG.completion_points));
    setStreakDays(String(DEFAULT_HABIT_POINTS_CONFIG.streak_milestone));
    setStreakBonus(String(DEFAULT_HABIT_POINTS_CONFIG.streak_bonus_points));
  };

  const updateOption = (idx: number, field: keyof RatingOption, value: string | number) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
  };

  const handleSaveRatings = async () => {
    if (options.find((o) => !o.type.trim() || !o.emoji.trim())) {
      setRatingsError('All ratings need a name and emoji.'); return;
    }
    if (options.length === 0) { setRatingsError('At least one rating option is required.'); return; }
    setRatingsSaving(true);
    setRatingsError('');
    try {
      await onSaveRatingOptions(options.map((o) => ({ ...o, type: o.type.trim(), emoji: o.emoji.trim() })));
      onClose();
    } catch (err) {
      setRatingsError(err instanceof Error ? err.message : 'Failed to save.');
    }
    setRatingsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl max-h-[92vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 flex items-center justify-between py-3 flex-shrink-0">
          <h2 className="text-lg font-bold text-ink">Rewards Settings</h2>
          <button onClick={onClose} className="text-ink-3 text-2xl leading-none">×</button>
        </div>

        {/* Tab bar */}
        <div className="px-4 flex-shrink-0">
          <div className="flex gap-1 bg-bg-deep rounded-xl p-1 mb-4">
            <button
              onClick={() => setTab('habits')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                tab === 'habits' ? 'bg-white text-amber shadow-sm' : 'text-ink-3'
              }`}
            >
              🔥 Habit Points
            </button>
            <button
              onClick={() => setTab('ratings')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                tab === 'ratings' ? 'bg-white text-lavender shadow-sm' : 'text-ink-3'
              }`}
            >
              ⭐ Task Ratings
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="px-4 overflow-y-auto flex-1">

          {/* ── HABIT POINTS TAB ── */}
          {tab === 'habits' && (
            <div className="space-y-5 pb-6">
              <p className="text-sm text-ink-4">
                Configure how many points kids earn from habits. Changes apply to all future completions.
              </p>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink">Points per habit completion</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min="1" max="100"
                    value={completionPts}
                    onChange={(e) => setCompletionPts(e.target.value)}
                    className="w-24 px-3 py-2.5 border border-line rounded-xl text-sm text-center font-bold text-ink focus:outline-none focus:ring-2 focus:ring-amber bg-gray-50"
                  />
                  <span className="text-sm text-ink-3">pts each time a kid completes a habit</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink">Streak bonus — every</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min="2" max="100"
                    value={streakDays}
                    onChange={(e) => setStreakDays(e.target.value)}
                    className="w-24 px-3 py-2.5 border border-line rounded-xl text-sm text-center font-bold text-ink focus:outline-none focus:ring-2 focus:ring-amber bg-gray-50"
                  />
                  <span className="text-sm text-ink-3">days in a row</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink">Streak bonus points</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min="1" max="500"
                    value={streakBonus}
                    onChange={(e) => setStreakBonus(e.target.value)}
                    className="w-24 px-3 py-2.5 border border-line rounded-xl text-sm text-center font-bold text-ink focus:outline-none focus:ring-2 focus:ring-amber bg-gray-50"
                  />
                  <span className="text-sm text-ink-3">bonus pts awarded at streak</span>
                </div>
              </div>

              <div className="bg-amber/10 rounded-xl px-4 py-3 text-sm text-amber font-medium space-y-1">
                <p>🔥 Complete a habit → <strong>+{completionPts || '?'} pt{Number(completionPts) !== 1 ? 's' : ''}</strong></p>
                <p>⭐ {streakDays || '?'}-day streak → <strong>+{streakBonus || '?'} bonus pt{Number(streakBonus) !== 1 ? 's' : ''}</strong></p>
              </div>

              {habitError && <p className="text-xs text-rose font-medium">{habitError}</p>}

              <div className="flex gap-2">
                <button
                  onClick={handleResetHabits}
                  className="flex-1 py-2.5 rounded-xl border-2 border-line text-ink-3 text-sm font-semibold hover:border-ink-3 transition-colors"
                >
                  Reset defaults
                </button>
                <button
                  onClick={() => void handleSaveHabits()}
                  disabled={habitSaving}
                  className="flex-1 py-2.5 rounded-xl bg-amber text-white text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {habitSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* ── TASK RATINGS TAB ── */}
          {tab === 'ratings' && (
            <div className="pb-6">
              <p className="text-sm text-gray-500 mb-4">
                Customise the rating options and their point values used when completing kid tasks.
              </p>

              {ratingsError && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {ratingsError}
                </div>
              )}

              <div className="space-y-3 mb-4">
                {options.map((opt, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.emoji}
                        onChange={(e) => updateOption(idx, 'emoji', e.target.value)}
                        className="w-12 h-10 text-center text-xl border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-lavender"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={opt.type}
                        onChange={(e) => updateOption(idx, 'type', e.target.value)}
                        placeholder="Rating name"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lavender"
                      />
                      {options.length > 1 && (
                        <button
                          onClick={() => setOptions((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-gray-300 hover:text-rose text-xl leading-none flex-shrink-0"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-12 text-right">Points</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateOption(idx, 'points', opt.points - 1)}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 font-bold flex items-center justify-center"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={opt.points}
                          onChange={(e) => updateOption(idx, 'points', parseInt(e.target.value) || 0)}
                          className="w-14 text-center py-1 border border-gray-200 rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-lavender"
                        />
                        <button
                          onClick={() => updateOption(idx, 'points', opt.points + 1)}
                          className="w-7 h-7 rounded-full border border-lavender text-lavender font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <span className={`text-xs font-semibold ${opt.points >= 0 ? 'text-mint' : 'text-rose'}`}>
                        {opt.points >= 0 ? '+' : ''}{opt.points} pts
                      </span>
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {EMOJI_SUGGESTIONS.map((em) => (
                        <button
                          key={em}
                          onClick={() => updateOption(idx, 'emoji', em)}
                          className={`text-lg w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            opt.emoji === em ? 'bg-lavender/20 ring-1 ring-lavender' : 'hover:bg-gray-100'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setOptions((prev) => [...prev, { type: 'New Rating', emoji: '⭐', points: 2 }])}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-lavender hover:text-lavender transition-colors mb-4"
              >
                + Add Rating Option
              </button>

              <button
                onClick={() => void handleSaveRatings()}
                disabled={ratingsSaving}
                className="w-full py-3 bg-lavender text-white font-bold rounded-xl disabled:opacity-50"
              >
                {ratingsSaving ? 'Saving…' : 'Save Ratings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
