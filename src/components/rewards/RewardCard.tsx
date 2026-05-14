import { useState } from 'react';
import type { Reward } from '../../utils/rewardModels';
import type { KidProfile } from '../../utils/familyModels';

const KID_COLOR_MAP: Record<string, string> = {
  lavender: '#b39ddb',
  peach: '#ffab91',
  mint: '#80cbc4',
  sky: '#81d4fa',
  amber: '#ffd54f',
  rose: '#f48fb1',
};

interface RewardCardProps {
  reward: Reward;
  kids: KidProfile[];
  getBalance: (kidId: string) => number;
  onRedeem: (kidId: string) => Promise<void>;
  onEdit: () => void;
  isOwner: boolean;
}

export default function RewardCard({ reward, kids, getBalance, onRedeem, onEdit, isOwner }: RewardCardProps) {
  const [confirming, setConfirming] = useState<string | null>(null); // kidId pending confirm
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const handleRedeemClick = (kidId: string) => {
    setConfirming(kidId);
  };

  const handleConfirm = async (kidId: string) => {
    setRedeeming(kidId);
    await onRedeem(kidId);
    setRedeeming(null);
    setConfirming(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-amber/15 flex items-center justify-center text-2xl flex-shrink-0">
          {reward.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-gray-900 text-sm leading-snug">{reward.title}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs font-extrabold text-amber bg-amber/15 px-2 py-0.5 rounded-full">
                ⭐ {reward.points_cost} pts
              </span>
              {isOwner && (
                <button
                  onClick={onEdit}
                  className="text-gray-300 hover:text-lavender transition-colors text-sm"
                  aria-label="Edit reward"
                >
                  ✏️
                </button>
              )}
            </div>
          </div>

          {reward.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{reward.description}</p>
          )}

          {/* Per-kid redeem buttons */}
          {kids.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {kids.map((kid) => {
                const balance = getBalance(kid.id);
                const canAfford = balance >= reward.points_cost;
                const isConfirming = confirming === kid.id;
                const isRedeeming = redeeming === kid.id;
                const kidColor = KID_COLOR_MAP[kid.color] ?? '#b39ddb';

                return (
                  <div key={kid.id}>
                    {isConfirming ? (
                      <div className="flex gap-1 items-center">
                        <span className="text-xs text-gray-500">{kid.name}?</span>
                        <button
                          onClick={() => setConfirming(null)}
                          className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600"
                        >
                          No
                        </button>
                        <button
                          onClick={() => void handleConfirm(kid.id)}
                          disabled={!!isRedeeming}
                          className="text-xs px-2 py-1 rounded-lg text-white font-semibold disabled:opacity-50"
                          style={{ backgroundColor: kidColor }}
                        >
                          {isRedeeming ? '...' : 'Yes!'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRedeemClick(kid.id)}
                        disabled={!canAfford}
                        className="text-xs px-3 py-1.5 rounded-full font-semibold border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          borderColor: kidColor,
                          color: canAfford ? 'white' : kidColor,
                          backgroundColor: canAfford ? kidColor : 'transparent',
                        }}
                        title={canAfford ? `Redeem for ${kid.name}` : `${kid.name} needs ${reward.points_cost - balance} more pts`}
                      >
                        {kid.name} ({balance}pts)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
