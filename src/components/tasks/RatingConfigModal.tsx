import { useState, useEffect } from 'react';
import type { RatingOption } from '../../utils/taskModels';

interface RatingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOptions: RatingOption[];
  onSave: (options: RatingOption[]) => Promise<void>;
}

const EMOJI_SUGGESTIONS = ['🌟', '👍', '😐', '👎', '🔥', '💪', '😊', '😢', '🎉', '❤️', '⭐', '😎'];

export default function RatingConfigModal({ isOpen, onClose, currentOptions, onSave }: RatingConfigModalProps) {
  const [options, setOptions] = useState<RatingOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setOptions(currentOptions.map((o) => ({ ...o })));
    setError('');
  }, [currentOptions, isOpen]);

  if (!isOpen) return null;

  const update = (idx: number, field: keyof RatingOption, value: string | number) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { type: 'New Rating', emoji: '⭐', points: 2 }]);
  };

  const remove = (idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const invalid = options.find((o) => !o.type.trim() || !o.emoji.trim());
    if (invalid) { setError('All ratings need a name and emoji.'); return; }
    if (options.length === 0) { setError('At least one rating option is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(options.map((o) => ({ ...o, type: o.type.trim(), emoji: o.emoji.trim() })));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between py-3 mb-2">
            <h2 className="text-lg font-bold text-gray-900">Configure Ratings</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Customise the rating options and their point values used when completing kid tasks.
          </p>

          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Rating rows */}
          <div className="space-y-3 mb-4">
            {options.map((opt, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {/* Emoji */}
                  <input
                    type="text"
                    value={opt.emoji}
                    onChange={(e) => update(idx, 'emoji', e.target.value)}
                    className="w-12 h-10 text-center text-xl border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-lavender"
                    maxLength={2}
                  />
                  {/* Label */}
                  <input
                    type="text"
                    value={opt.type}
                    onChange={(e) => update(idx, 'type', e.target.value)}
                    placeholder="Rating name"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lavender"
                  />
                  {/* Delete */}
                  {options.length > 1 && (
                    <button
                      onClick={() => remove(idx)}
                      className="text-gray-300 hover:text-rose text-xl leading-none flex-shrink-0"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Points */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-12 text-right">Points</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => update(idx, 'points', opt.points - 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 font-bold flex items-center justify-center"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={opt.points}
                      onChange={(e) => update(idx, 'points', parseInt(e.target.value) || 0)}
                      className="w-14 text-center py-1 border border-gray-200 rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-lavender"
                    />
                    <button
                      onClick={() => update(idx, 'points', opt.points + 1)}
                      className="w-7 h-7 rounded-full border border-lavender text-lavender font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <span className={`text-xs font-semibold ${opt.points >= 0 ? 'text-mint' : 'text-rose'}`}>
                    {opt.points >= 0 ? '+' : ''}{opt.points} pts
                  </span>
                </div>

                {/* Emoji quick-picks */}
                <div className="flex gap-1 flex-wrap">
                  {EMOJI_SUGGESTIONS.map((em) => (
                    <button
                      key={em}
                      onClick={() => update(idx, 'emoji', em)}
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

          {/* Add option */}
          <button
            onClick={addOption}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-lavender hover:text-lavender transition-colors mb-6"
          >
            + Add Rating Option
          </button>
        </div>

        {/* Sticky footer */}
        <div className="flex-shrink-0 px-4 pt-3 pb-6 border-t border-gray-100 bg-white">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-lavender text-white font-bold rounded-xl disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Ratings'}
          </button>
        </div>
      </div>
    </div>
  );
}
