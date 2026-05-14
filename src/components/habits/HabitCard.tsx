import type { Habit } from '../../utils/habitModels';
import { CATEGORY_LABELS, CATEGORY_ICONS, FREQUENCY_LABELS, isScheduledToday } from '../../utils/habitModels';
import type { KidProfile } from '../../utils/familyModels';

const KID_COLOR_MAP: Record<string, string> = {
  lavender: '#b39ddb',
  peach: '#ffab91',
  mint: '#80cbc4',
  sky: '#81d4fa',
  amber: '#ffd54f',
  rose: '#f48fb1',
};

interface HabitCardProps {
  habit: Habit;
  assignee: string; // 'me' or kid_id
  todayCount: number;
  streak: number;
  kids: KidProfile[];
  onComplete: () => void;
  onUndo: () => void;
  onEdit: () => void;
}

function CompletionDots({ count, target, color }: { count: number; target: number; color: string }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: target }, (_, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
          style={{
            backgroundColor: i < count ? color : 'transparent',
            borderColor: color,
          }}
        >
          {i < count && <span className="text-white text-xs leading-none">✓</span>}
        </div>
      ))}
    </div>
  );
}

export default function HabitCard({ habit, assignee, todayCount, streak, kids, onComplete, onUndo, onEdit }: HabitCardProps) {
  const isCompleted = todayCount >= habit.target_count;
  const scheduled = isScheduledToday(habit);

  const assigneeColor =
    assignee === 'me'
      ? '#7C6FF0'
      : KID_COLOR_MAP[kids.find((k) => k.id === assignee)?.color ?? 'lavender'];

  const accentColor = isCompleted ? '#2EB87A' : assigneeColor;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-opacity ${
        !scheduled ? 'opacity-50' : isCompleted ? 'opacity-75' : ''
      }`}
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="flex items-center gap-3">
        {/* Icon bubble */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          {habit.icon}
        </div>

        {/* Info — tappable area opens edit */}
        <div
          className="flex-1 min-w-0"
          onClick={onEdit}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onEdit()}
        >
          <p className={`font-semibold text-sm text-gray-900 leading-snug ${isCompleted ? 'line-through text-gray-400' : ''}`}>
            {habit.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-400">
              {CATEGORY_ICONS[habit.category]} {CATEGORY_LABELS[habit.category]}
            </span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-400">{FREQUENCY_LABELS[habit.frequency]}</span>
          </div>
        </div>

        {/* Right side: streak + action */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {streak > 0 && (
            <span className="text-xs font-bold" style={{ color: '#E8A800' }}>
              🔥 {streak}
            </span>
          )}

          {scheduled ? (
            <div className="flex items-center gap-2">
              <CompletionDots count={todayCount} target={habit.target_count} color={accentColor} />

              {isCompleted ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onUndo(); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-rose hover:bg-red-50 transition-colors text-base"
                  aria-label="Undo completion"
                >
                  ↩
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onComplete(); }}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all active:scale-90"
                  style={{ borderColor: assigneeColor, color: assigneeColor }}
                  aria-label="Complete habit"
                >
                  +
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">Not today</span>
          )}
        </div>
      </div>
    </div>
  );
}
