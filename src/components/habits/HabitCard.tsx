import { useState, useRef, useEffect } from 'react';
import type { Habit } from '../../utils/habitModels';
import { CATEGORY_LABELS, CATEGORY_ICONS, FREQUENCY_LABELS, isScheduledToday, isScheduledForDay, todayStr } from '../../utils/habitModels';
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
  completedDates?: Set<string>; // pre-filtered dates for this habit+assignee
  onComplete: (date: string) => void;
  onUndo: (date?: string) => void;
  onEdit: () => void;
}

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function WeekStrip({ habit, completedDates, accentColor, onComplete, onUndo }: {
  habit: Habit;
  completedDates: Set<string>;
  accentColor: string;
  onComplete: (date: string) => void;
  onUndo: (date: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i)); // oldest on left, today on right
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const dayOfMonth = d.getDate();
    const month = d.getMonth();
    const scheduled = isScheduledForDay(habit, dayOfWeek);
    const completed = completedDates.has(dateStr);
    const isToday = i === 29;
    const showMonthLabel = dayOfMonth === 1;
    return { dateStr, dayOfWeek, dayOfMonth, month, scheduled, completed, isToday, showMonthLabel };
  });

  // Scroll to today (rightmost) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 mt-3 pt-3 border-t border-gray-100 overflow-x-auto no-scrollbar"
    >
      {days.map(({ dateStr, dayOfWeek, dayOfMonth, month, scheduled, completed, isToday, showMonthLabel }) => (
        <div key={dateStr} className="flex flex-col items-center gap-0.5 flex-shrink-0 w-7">
          {/* Month label on 1st of month */}
          <span className="text-[9px] font-bold text-lavender h-3 leading-3">
            {showMonthLabel ? MONTH_ABBR[month] : ''}
          </span>
          {/* Day abbreviation */}
          <span className={`text-[10px] font-medium ${isToday ? 'text-gray-800 font-bold' : 'text-gray-400'}`}>
            {isToday ? 'now' : DAY_ABBR[dayOfWeek]}
          </span>
          {/* Date number */}
          <span className={`text-[9px] ${isToday ? 'text-gray-600 font-semibold' : 'text-gray-300'}`}>
            {dayOfMonth}
          </span>
          {/* Circle */}
          {scheduled ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                completed ? onUndo(dateStr) : onComplete(dateStr);
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{
                backgroundColor: completed ? accentColor : `${accentColor}20`,
                border: `1.5px solid ${completed ? accentColor : `${accentColor}40`}`,
                outline: isToday ? `2px solid ${accentColor}` : 'none',
                outlineOffset: '2px',
              }}
              aria-label={completed ? `Undo ${dateStr}` : `Complete for ${dateStr}`}
            >
              {completed && <span className="text-white text-[10px] leading-none">✓</span>}
            </button>
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center">
              <span className="text-gray-200 text-[10px]">–</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
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

export default function HabitCard({ habit, assignee, todayCount, streak, kids, completedDates, onComplete, onUndo, onEdit }: HabitCardProps) {
  const isCompleted = todayCount >= habit.target_count;
  const scheduled = isScheduledToday(habit);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const handleDateSelect = (date: string) => {
    onComplete(date);
    setShowDatePicker(false);
    setCustomDate('');
  };

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
                  onClick={(e) => { e.stopPropagation(); setShowDatePicker(true); }}
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

      {/* 30-day scrollable history strip */}
      {completedDates && (
        <WeekStrip
          habit={habit}
          completedDates={completedDates}
          accentColor={accentColor}
          onComplete={onComplete}
          onUndo={onUndo}
        />
      )}

      {/* Backdate picker */}
      {showDatePicker && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-gray-500">Log for which day?</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDateSelect(todayStr())}
              className="flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all"
              style={{ borderColor: assigneeColor, color: assigneeColor }}
            >
              Today
            </button>
            <button
              onClick={() => handleDateSelect(yesterday)}
              className="flex-1 py-2 rounded-xl text-xs font-bold border-2 border-gray-200 text-gray-600 hover:border-gray-400 transition-all"
            >
              Yesterday
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={customDate}
              max={yesterday}
              min={minDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': assigneeColor } as React.CSSProperties}
            />
            <button
              onClick={() => customDate && handleDateSelect(customDate)}
              disabled={!customDate}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-30 transition-all"
              style={{ backgroundColor: assigneeColor }}
            >
              Log
            </button>
          </div>
          <button
            onClick={() => { setShowDatePicker(false); setCustomDate(''); }}
            className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
