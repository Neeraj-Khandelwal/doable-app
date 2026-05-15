import { useState, useMemo } from 'react';
import type { Task } from '../../utils/taskModels';
import type { KidProfile } from '../../utils/familyModels';
import TaskCard from './TaskCard';

interface CalendarViewProps {
  tasks: Task[];
  kids: KidProfile[];
  currentUserId?: string;
  onComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onReassign?: (task: Task) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarView({ tasks, kids, currentUserId, onComplete, onEdit, onDelete, onReassign }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map ISO date → tasks due on that day
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (t.due_date) {
        if (!map[t.due_date]) map[t.due_date] = [];
        map[t.due_date].push(t);
      }
    });
    return map;
  }, [tasks]);

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] ?? []) : [];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="space-y-3">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-deep text-ink-3 text-lg">‹</button>
        <span className="font-bold text-ink text-base">
          {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-deep text-ink-3 text-lg">›</button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <div key={d} className="text-xs font-semibold text-ink-4 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Leading empty cells */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = isoDate(year, month, day);
          const dayTasks = tasksByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          const dots = dayTasks.slice(0, 3);
          const extra = dayTasks.length - 3;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`flex flex-col items-center justify-start pt-1 pb-1.5 rounded-lg min-h-[48px] transition-colors ${
                isSelected ? 'bg-lavender/15 ring-2 ring-lavender' :
                isToday ? 'bg-amber/10' :
                'hover:bg-bg-deep'
              }`}
            >
              <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                isToday ? 'bg-amber text-white' : 'text-ink-2'
              }`}>
                {day}
              </span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-center mt-0.5 px-1">
                  {dots.map((t, di) => (
                    <span
                      key={di}
                      className={`w-1.5 h-1.5 rounded-full ${t.completed_at ? 'opacity-30' : ''}`}
                      style={{
                        backgroundColor:
                          t.priority === 'high' ? '#E85450' :
                          t.priority === 'medium' ? '#E8A800' : '#9CA3AF',
                      }}
                    />
                  ))}
                  {extra > 0 && <span className="text-[9px] text-ink-4 font-bold">+{extra}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day task list */}
      {selectedDate && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-ink-4 font-medium">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {selectedTasks.length > 0 ? ` · ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}` : ' · No tasks'}
            </span>
            <div className="flex-1 h-px bg-line" />
          </div>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-ink-4 text-center py-4">No tasks due on this day</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  kids={kids}
                  currentUserId={currentUserId}
                  onComplete={onComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReassign={onReassign}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
