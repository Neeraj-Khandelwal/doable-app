import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFastingContext } from '../context/FastingContext';
import { useConfetti } from '../hooks/useConfetti';
import ProgressRing from '../components/fasting/ProgressRing';
import LiveTimer from '../components/fasting/LiveTimer';
import {
  FASTING_STAGES,
  GOAL_PRESETS,
  getCurrentStage,
  getProgressPercent,
  sessionDurationMinutes,
} from '../utils/fastingModels';

export default function Fasting() {
  const {
    currentSession,
    sessionHistory,
    goalHours,
    elapsedSeconds,
    loading,
    error,
    startFast,
    endFast,
    setGoal,
  } = useFastingContext();

  const { fire } = useConfetti();
  const confettiFiredRef = useRef(false);
  const [customGoal, setCustomGoal] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const goalMinutes = goalHours * 60;
  const percent = getProgressPercent(elapsedMinutes, goalMinutes);
  const stage = getCurrentStage(elapsedMinutes);

  // Confetti fires once when reaching 70% of goal
  useEffect(() => {
    if (percent >= 70 && !confettiFiredRef.current && currentSession) {
      confettiFiredRef.current = true;
      fire(['#2FA8E0', '#2EB87A', '#E8A800']);
    }
    if (!currentSession) confettiFiredRef.current = false;
  }, [percent, currentSession, fire]);

  const handleStart = async () => {
    setActionLoading(true);
    setActionError('');
    const result = await startFast();
    if (result.error) setActionError(result.error);
    setActionLoading(false);
  };

  const handleEnd = async () => {
    setActionLoading(true);
    setActionError('');
    setShowEndConfirm(false);
    const result = await endFast();
    if (result.error) {
      setActionError(result.error);
    } else {
      fire(['#2FA8E0', '#2EB87A', '#E8A800', '#E85450', '#7C6FF0']);
    }
    setActionLoading(false);
  };

  const handleGoalPreset = async (hours: number) => {
    await setGoal(hours);
  };

  const handleCustomGoal = async () => {
    const h = parseInt(customGoal);
    if (!h || h < 1 || h > 48) {
      setActionError('Enter a goal between 1 and 48 hours.');
      return;
    }
    await setGoal(h);
    setCustomGoal('');
    setActionError('');
  };

  // Chart: last 7 completed sessions oldest→newest
  const chartData = [...sessionHistory]
    .slice(0, 7)
    .reverse()
    .map((s) => ({
      date: new Date(s.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: parseFloat((sessionDurationMinutes(s) / 60).toFixed(1)),
      completed: sessionDurationMinutes(s) >= s.goal_minutes,
    }));

  const weekSessions = sessionHistory.slice(0, 7);
  const totalHours = weekSessions.reduce((sum, s) => sum + sessionDurationMinutes(s) / 60, 0);
  const avgHours = weekSessions.length > 0 ? totalHours / weekSessions.length : 0;
  const completedCount = weekSessions.filter((s) => sessionDurationMinutes(s) >= s.goal_minutes).length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Fasting Tracker</h1>
        <span className="text-xs font-semibold text-sky bg-sky/10 px-3 py-1.5 rounded-full">
          Goal: {goalHours}h
        </span>
      </div>

      {/* Errors */}
      {(error || actionError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error || actionError}
        </div>
      )}

      {/* ── ACTIVE FAST ── */}
      {currentSession ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          {/* Progress ring */}
          <div className="flex justify-center">
            <ProgressRing percent={percent} size={210} strokeWidth={20}>
              <span className="text-4xl mb-1">{stage.emoji}</span>
              <LiveTimer elapsedSeconds={elapsedSeconds} />
              <span className="text-xs font-semibold text-gray-400 mt-1">{percent}% complete</span>
            </ProgressRing>
          </div>

          {/* Stage name + message */}
          <div className="text-center">
            <p className="text-base font-extrabold text-gray-800">{stage.name}</p>
            <p className="text-sm text-gray-500 mt-1 leading-snug">{stage.message}</p>
          </div>

          {/* Stage progress dots */}
          <div className="flex items-end justify-between px-1">
            {FASTING_STAGES.map((s) => {
              const reached = elapsedMinutes / 60 >= s.hours;
              const isCurrent = stage.hours === s.hours;
              return (
                <div key={s.hours} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-300 ${
                      isCurrent
                        ? 'bg-sky text-white shadow-md scale-110'
                        : reached
                        ? 'bg-mint text-white'
                        : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    {s.emoji}
                  </div>
                  <span className="text-xs text-gray-400">{s.hours}h</span>
                </div>
              );
            })}
          </div>

          {/* Goal progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>0h</span>
              <span>{goalHours}h goal</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-1000"
                style={{
                  width: `${percent}%`,
                  backgroundColor: percent >= 100 ? '#E8A800' : percent >= 70 ? '#2EB87A' : '#2FA8E0',
                }}
              />
            </div>
          </div>

          {/* End fast */}
          {showEndConfirm ? (
            <div className="space-y-2">
              <p className="text-sm text-center text-gray-600 font-medium">End your fast now?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl"
                >
                  Keep going
                </button>
                <button
                  onClick={handleEnd}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-rose text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {actionLoading ? 'Ending...' : 'End Fast'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="w-full py-3.5 bg-rose text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              End Fast
            </button>
          )}
        </div>
      ) : (
        /* ── NO ACTIVE FAST ── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
          <div className="text-6xl">🍽️</div>
          <div>
            <p className="text-lg font-extrabold text-gray-800">Ready to fast?</p>
            <p className="text-sm text-gray-500 mt-1">
              Your <span className="font-semibold text-sky">{goalHours}h</span> fasting window awaits
            </p>
          </div>

          {/* Stage preview */}
          <div className="flex items-end justify-between px-1">
            {FASTING_STAGES.map((s) => (
              <div key={s.hours} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-base text-gray-300">
                  {s.emoji}
                </div>
                <span className="text-xs text-gray-400">{s.hours}h</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleStart}
            disabled={actionLoading}
            className="w-full py-4 font-bold text-white rounded-xl disabled:opacity-50 transition-opacity text-lg"
            style={{ background: 'linear-gradient(135deg, #2FA8E0 0%, #2EB87A 100%)' }}
          >
            {actionLoading ? 'Starting...' : '⚡ Start Fast'}
          </button>
        </div>
      )}

      {/* ── GOAL SETTINGS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Fasting Goal</h2>

        <div className="flex flex-wrap gap-2">
          {GOAL_PRESETS.map((h) => (
            <button
              key={h}
              onClick={() => handleGoalPreset(h)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                goalHours === h
                  ? 'bg-sky text-white shadow-sm scale-95'
                  : 'bg-gray-100 text-gray-600 hover:bg-sky/10 hover:text-sky'
              }`}
            >
              {h === 23 ? 'OMAD' : `${h}h`}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomGoal()}
            placeholder="Custom (1–48 hrs)"
            min={1}
            max={48}
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky"
          />
          <button
            onClick={handleCustomGoal}
            className="px-4 py-2.5 bg-sky text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Set
          </button>
        </div>
      </div>

      {/* ── HISTORY ── */}
      {sessionHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Recent Fasts</h2>

          {/* Weekly stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total hrs', value: totalHours.toFixed(1), color: 'text-sky' },
              { label: 'Avg hrs',   value: avgHours.toFixed(1),   color: 'text-mint' },
              { label: 'Completed', value: `${completedCount}/${weekSessions.length}`, color: 'text-amber' },
            ].map((s) => (
              <div key={s.label} className="text-center bg-gray-50 rounded-xl py-3">
                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          {chartData.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={chartData} barSize={26} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis domain={[0, Math.max(goalHours + 4, 24)]} hide />
                  <Tooltip
                    formatter={(v) => [`${v}h`, 'Duration']}
                    contentStyle={{
                      borderRadius: 10,
                      border: 'none',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.completed ? '#2EB87A' : '#2FA8E0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#2EB87A' }} />
                  Goal reached
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#2FA8E0' }} />
                  Partial fast
                </span>
              </div>
            </>
          )}

          {/* Session list */}
          <div className="space-y-2">
            {weekSessions.map((s) => {
              const dur = sessionDurationMinutes(s);
              const h = Math.floor(dur / 60);
              const m = dur % 60;
              const reached = dur >= s.goal_minutes;
              return (
                <div key={s.id} className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-xl">
                  <span className="text-lg">{reached ? '✅' : '⏱️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {h}h {m > 0 ? `${m}m` : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.start_time).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      reached ? 'bg-mint/10 text-mint' : 'bg-sky/10 text-sky'
                    }`}
                  >
                    {reached ? 'Done' : `${Math.round((dur / s.goal_minutes) * 100)}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
