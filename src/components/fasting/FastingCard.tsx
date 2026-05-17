import { useNavigate } from 'react-router-dom';
import { useFastingContext } from '../../context/FastingContext';
import { FASTING_STAGES, getCurrentStage, getProgressPercent } from '../../utils/fastingModels';
import LiveTimer from './LiveTimer';

const STAGE_COLORS = ['#94a3b8', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#6366f1'];

export default function FastingCard() {
  const navigate = useNavigate();
  const { currentSession, elapsedSeconds, goalHours, loading } = useFastingContext();

  if (loading) return null;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const percent = getProgressPercent(elapsedMinutes, goalHours * 60);
  const stage = getCurrentStage(elapsedMinutes);
  const stageIdx = FASTING_STAGES.indexOf(stage);
  const nextStage = FASTING_STAGES[stageIdx + 1] ?? null;
  const minutesToNext = nextStage ? nextStage.hours * 60 - elapsedMinutes : 0;
  const hoursToNext = Math.floor(minutesToNext / 60);
  const minsToNext = minutesToNext % 60;
  const goalReached = percent >= 100;

  // ── No active fast ──
  if (!currentSession) {
    return (
      <div
        onClick={() => navigate('/fasting')}
        className="rounded-2xl p-4 border-2 border-dashed border-amber/40 cursor-pointer transition-all hover:border-amber/70 hover:shadow-sm"
        style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber uppercase tracking-wider mb-0.5">
              Intermittent Fasting
            </p>
            <p className="text-sm font-semibold text-ink-2">Ready to start your fast?</p>
            <p className="text-xs text-ink-4 mt-1">Goal: {goalHours}h · {FASTING_STAGES.length} stages to unlock</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">🍽️</span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/fasting'); }}
              className="text-xs font-bold text-white bg-amber px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"
            >
              Start Fast
            </button>
          </div>
        </div>

        {/* Stage preview */}
        <div className="flex items-center gap-1 mt-3">
          {FASTING_STAGES.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-sm opacity-40">{s.emoji}</span>
              <div className="w-full h-1 rounded-full bg-amber/20" />
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-ink-4 mt-1.5">Unlock stages as you fast</p>
      </div>
    );
  }

  // ── Active fast ──
  return (
    <div
      onClick={() => navigate('/fasting')}
      className="rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md"
      style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fff7ed 100%)', border: '2px solid #fde68a' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse inline-block" />
            <p className="text-xs font-bold text-amber uppercase tracking-wider">Fasting Active</p>
          </div>
          <LiveTimer elapsedSeconds={elapsedSeconds} size="sm" />
          <p className="text-xs text-ink-3 mt-0.5">{percent}% of {goalHours}h goal</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl drop-shadow-sm">{stage.emoji}</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: STAGE_COLORS[stageIdx] }}
          >
            {stage.name}
          </span>
        </div>
      </div>

      {/* Stage milestone dots */}
      <div className="flex items-center gap-1 mb-2">
        {FASTING_STAGES.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className={`text-sm transition-all ${i <= stageIdx ? 'opacity-100' : 'opacity-25'}`}>
              {s.emoji}
            </span>
            <div
              className="w-full h-1.5 rounded-full transition-all"
              style={{ backgroundColor: i <= stageIdx ? STAGE_COLORS[i] : '#e5e7eb' }}
            />
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-amber/20 rounded-full h-2 mb-2.5 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-1000"
          style={{
            width: `${percent}%`,
            background: goalReached
              ? 'linear-gradient(90deg, #10b981, #6366f1)'
              : 'linear-gradient(90deg, #f59e0b, #f97316)',
          }}
        />
      </div>

      {/* Motivational message / next stage */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-3 italic flex-1 mr-2 leading-relaxed">
          {goalReached ? '🎉 Goal reached! ' : ''}{stage.message}
        </p>
        {nextStage && !goalReached && (
          <div className="flex-shrink-0 text-right">
            <p className="text-[10px] text-ink-4 font-medium">Next stage</p>
            <p className="text-xs font-bold text-ink-2">{nextStage.emoji} {hoursToNext}h {minsToNext}m</p>
          </div>
        )}
      </div>
    </div>
  );
}
