import { useState, useEffect } from 'react';
import type { Reward } from '../../utils/rewardModels';
import { REWARD_ICONS, POINT_PRESETS } from '../../utils/rewardModels';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Reward>) => Promise<void>;
  onDelete?: () => Promise<void>;
  reward?: Reward | null;
}

export default function RewardModal({ isOpen, onClose, onSave, onDelete, reward }: RewardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎁');
  const [pointsCost, setPointsCost] = useState(10);
  const [customPoints, setCustomPoints] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (reward) {
      setTitle(reward.title);
      setDescription(reward.description ?? '');
      setIcon(reward.icon);
      setPointsCost(reward.points_cost);
      setCustomPoints(POINT_PRESETS.includes(reward.points_cost) ? '' : String(reward.points_cost));
    } else {
      setTitle('');
      setDescription('');
      setIcon('🎁');
      setPointsCost(10);
      setCustomPoints('');
    }
    setError('');
    setConfirmDelete(false);
  }, [reward, isOpen]);

  if (!isOpen) return null;

  const effectivePoints = customPoints ? Math.max(1, parseInt(customPoints) || 1) : pointsCost;

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (effectivePoints < 1) { setError('Points cost must be at least 1.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        icon,
        points_cost: effectivePoints,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete. Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
      return;
    }
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center justify-between py-3 mb-2">
            <h2 className="text-lg font-bold text-gray-900">{reward ? 'Edit Reward' : 'New Reward'}</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none hover:text-gray-600">×</button>
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Icon picker */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-1.5">
              {REWARD_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-amber/20 ring-2 ring-amber'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Reward Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Extra screen time, Ice cream trip..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber bg-gray-50"
            />
          </div>

          {/* Points cost */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Points Cost *
              <span className="ml-2 font-bold text-amber">⭐ {effectivePoints} pts</span>
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {POINT_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setPointsCost(p); setCustomPoints(''); }}
                  className={`py-2 text-sm font-semibold rounded-lg border-2 transition-colors ${
                    pointsCost === p && !customPoints
                      ? 'border-amber bg-amber/15 text-amber'
                      : 'border-gray-100 text-gray-500 bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={9999}
              value={customPoints}
              onChange={(e) => { setCustomPoints(e.target.value); setPointsCost(0); }}
              placeholder="Custom amount..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber bg-gray-50"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any details about this reward..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber bg-gray-50 resize-none"
            />
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex-shrink-0 px-4 pt-3 pb-6 border-t border-gray-100 bg-white flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-amber text-white font-bold rounded-xl disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving...' : reward ? 'Update Reward' : 'Create Reward'}
          </button>

          {reward && onDelete && (
            confirmDelete ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-3 bg-rose text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full py-3 text-rose font-semibold rounded-xl border border-rose/30 hover:bg-red-50 transition-colors"
              >
                Delete Reward
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
