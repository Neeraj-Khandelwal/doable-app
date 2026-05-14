import { useNavigate } from 'react-router-dom';
import { useFastingContext } from '../../context/FastingContext';
import { getCurrentStage, getProgressPercent } from '../../utils/fastingModels';
import LiveTimer from './LiveTimer';

export default function FastingCard() {
  const navigate = useNavigate();
  const { currentSession, elapsedSeconds, goalHours, loading } = useFastingContext();

  if (loading) return null;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const percent = getProgressPercent(elapsedMinutes, goalHours * 60);
  const stage = getCurrentStage(elapsedMinutes);

  // ── No active fast ──
  if (!currentSession) {
    return (
      <div
        onClick={() => navigate('/fasting')}
        className="rounded-2xl p-4 border border-line-soft bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-ink-4 uppercase tracking-wider mb-0.5">
              Intermittent Fasting
            </p>
            <p className="text-base font-bold text-ink-2">Not currently fasting</p>
            <p className="text-xs text-ink-4 mt-0.5">Goal: {goalHours}h window</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">🍽️</span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/fasting'); }}
              className="text-xs font-bold text-shagun bg-shagun-soft px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
            >
              Start Fast
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active fast ──
  return (
    <div
      onClick={() => navigate('/fasting')}
      className="rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
      style={{ background: 'linear-gradient(135deg, #4A2D5C 0%, #3D3A7A 100%)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-white opacity-80 mb-0.5">🔥 Fasting in progress</p>
          <LiveTimer elapsedSeconds={elapsedSeconds} size="sm" />
          <p className="text-xs text-white opacity-70 mt-0.5">{percent}% of {goalHours}h goal</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-3xl">{stage.emoji}</span>
          <span className="text-xs font-bold text-white opacity-90">{stage.name}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white/20 rounded-full h-2">
        <div
          className="bg-white rounded-full h-2 transition-all duration-1000"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-xs text-white opacity-60 mt-1.5 text-center">
        Tap for details
      </p>
    </div>
  );
}
