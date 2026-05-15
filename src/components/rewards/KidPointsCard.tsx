import type { KidProfile } from '../../utils/familyModels';

const KID_COLOR_MAP: Record<string, { bg: string; ring: string; hex: string }> = {
  lavender: { bg: '#f3f0fd', ring: '#b39ddb', hex: '#7C6FF0' },
  peach:    { bg: '#fff3ef', ring: '#ffab91', hex: '#FF8F5E' },
  mint:     { bg: '#edfaf4', ring: '#80cbc4', hex: '#2EB87A' },
  sky:      { bg: '#e8f6fd', ring: '#81d4fa', hex: '#2FA8E0' },
  amber:    { bg: '#fef9e7', ring: '#ffd54f', hex: '#E8A800' },
  rose:     { bg: '#fef0f0', ring: '#f48fb1', hex: '#E85450' },
};

interface KidPointsCardProps {
  kid: KidProfile;
  balance: number;
  earned: number;
  spent: number;
  rank?: number;
  onGivePoints?: () => void;
}

export default function KidPointsCard({ kid, balance, earned, spent, onGivePoints }: KidPointsCardProps) {
  const colors = KID_COLOR_MAP[kid.color] ?? KID_COLOR_MAP.lavender;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden"
      style={{ backgroundColor: colors.bg, border: `2px solid ${colors.ring}` }}
    >
      {/* Give points button (owner only) */}
      {onGivePoints && (
        <button
          onClick={onGivePoints}
          className="absolute bottom-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm transition-opacity hover:opacity-80"
          style={{ backgroundColor: colors.hex }}
          aria-label={`Give points to ${kid.name}`}
        >
          ±
        </button>
      )}

      {/* Avatar + name */}
      <div className="flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: colors.hex }}
        >
          {kid.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-bold text-gray-900 text-sm">{kid.name}</span>
      </div>

      {/* Points balance */}
      <div className="flex items-end gap-1">
        <span className="text-3xl font-extrabold text-gray-900">{Math.max(0, balance)}</span>
        <span className="text-sm text-gray-500 mb-1">pts</span>
      </div>

      {/* Earned / spent breakdown */}
      <div className="flex gap-3 text-xs text-gray-500">
        <span>✅ {Math.max(0, earned)} earned</span>
        <span>🎁 {spent} spent</span>
      </div>
    </div>
  );
}
