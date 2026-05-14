import { useState, useEffect } from 'react';
import type { Task, RatingType } from '../../utils/taskModels';
import { useFamilyContext } from '../../context/FamilyContext';
import type { KidProfile } from '../../utils/familyModels';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ratings: { kid_id: string; rating_type: RatingType }[]) => Promise<void>;
  task: Task | null;
  kids: KidProfile[];
}

const KID_COLOR_MAP: Record<string, string> = {
  lavender: '#b39ddb',
  peach: '#ffab91',
  mint: '#80cbc4',
  sky: '#81d4fa',
  amber: '#ffd54f',
  rose: '#f48fb1',
};

export default function RatingModal({ isOpen, onClose, onConfirm, task, kids }: RatingModalProps) {
  const { ratingConfig: RATING_OPTIONS } = useFamilyContext();
  const [ratings, setRatings] = useState<Record<string, RatingType>>({});
  const [confirming, setConfirming] = useState(false);

  const assignedKids = task
    ? kids.filter((k) => task.assignees.includes(k.id))
    : [];

  useEffect(() => {
    setRatings({});
    setConfirming(false);
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const allRated = assignedKids.length > 0 && assignedKids.every((k) => ratings[k.id]);

  const handleConfirm = async () => {
    if (!allRated) return;
    setConfirming(true);
    const ratingList = assignedKids.map((k) => ({
      kid_id: k.id,
      rating_type: ratings[k.id],
    }));
    await onConfirm(ratingList);
    setConfirming(false);
  };

  const totalPoints = assignedKids.reduce((sum, k) => {
    const option = RATING_OPTIONS.find((o) => o.type === ratings[k.id]);
    return sum + (option?.points ?? 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 pb-8">
          <div className="flex items-center justify-between py-3 mb-1">
            <h2 className="text-lg font-bold text-gray-900">Rate Task</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
          </div>

          <p className="text-sm text-gray-500 mb-4 leading-snug">
            How well did each kid complete{' '}
            <span className="font-semibold text-gray-800">"{task.title}"</span>?
          </p>

          {assignedKids.map((kid) => (
            <div key={kid.id} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: KID_COLOR_MAP[kid.color] }}
                />
                <span className="font-semibold text-gray-800">{kid.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {RATING_OPTIONS.map((opt) => {
                  const selected = ratings[kid.id] === opt.type;
                  return (
                    <button
                      key={opt.type}
                      onClick={() => setRatings((prev) => ({ ...prev, [kid.id]: opt.type }))}
                      className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                        selected
                          ? 'border-lavender bg-lavender/10 scale-95'
                          : 'border-gray-100 bg-gray-50 hover:border-lavender'
                      }`}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      <span className={`text-xs font-semibold ${selected ? 'text-lavender' : 'text-gray-600'}`}>
                        {opt.type}
                      </span>
                      <span className={`text-xs font-bold ${opt.points >= 0 ? 'text-mint' : 'text-rose'}`}>
                        {opt.points >= 0 ? '+' : ''}{opt.points} pts
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Points summary */}
          {allRated && (
            <div className="mb-4 py-2 px-3 bg-mint/10 rounded-lg text-center">
              <span className="text-sm font-semibold text-mint">
                Total: {totalPoints >= 0 ? '+' : ''}{totalPoints} points awarded
              </span>
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!allRated || confirming}
              className="flex-1 py-3 bg-lavender text-white font-bold rounded-xl disabled:opacity-40 transition-opacity"
            >
              {confirming ? 'Saving...' : 'Confirm & Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
