import { useState } from 'react';
import { useHabitContext } from '../context/HabitContext';
import { useFamilyContext } from '../context/FamilyContext';
import { useRewardsContext } from '../context/RewardsContext';
import { useConfetti } from '../hooks/useConfetti';
import type { Habit } from '../utils/habitModels';
import HabitCard from '../components/habits/HabitCard';
import HabitModal from '../components/habits/HabitModal';

export default function Habits() {
  const { habits, completions, loading, error, createHabit, updateHabit, deleteHabit, completeHabit, undoComplete, getTodayCount, getStreak } =
    useHabitContext();
  const { kidProfiles } = useFamilyContext();
  const { refreshRewards } = useRewardsContext();
  const { fireForKids } = useConfetti();

  const [activeTab, setActiveTab] = useState<string>('me');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [bonusKidId, setBonusKidId] = useState<string | null>(null);

  const tabs = [
    { key: 'me', label: 'Mine' },
    ...kidProfiles.map((k) => ({ key: k.id, label: k.name })),
  ];

  const visibleHabits = habits.filter((h) => h.assignees.includes(activeTab));

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingHabit(null);
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<Habit>) => {
    let result;
    if (editingHabit) {
      result = await updateHabit(editingHabit.id, data);
    } else {
      result = await createHabit(data);
    }
    if (result?.error) throw new Error(result.error);
    setModalOpen(false);
    setEditingHabit(null);
  };

  const handleDelete = async () => {
    if (!editingHabit) return;
    const result = await deleteHabit(editingHabit.id);
    if (result?.error) throw new Error(result.error);
    setModalOpen(false);
    setEditingHabit(null);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Streak bonus toast */}
      {bonusKidId && (() => {
        const kid = kidProfiles.find((k) => k.id === bonusKidId);
        return kid ? (
          <div className="fixed top-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <div className="bg-amber text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-bounce">
              🔥 {kid.name} earned +5 bonus pts for a 7-day streak!
            </div>
          </div>
        ) : null;
      })()}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Habits</h1>
          <p className="text-sm text-ink-3 mt-0.5">{visibleHabits.length} habit{visibleHabits.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-11 h-11 bg-ink text-bg rounded-2xl text-xl font-bold flex items-center justify-center hover:opacity-80 transition-all active:scale-95"
          aria-label="Add habit"
        >
          +
        </button>
      </div>

      {/* Person tabs */}
      <div className="flex gap-1 bg-bg-deep rounded-xl p-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 flex-1 min-w-[60px] py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-lavender shadow-sm'
                : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-soft border border-red/20 rounded-xl text-sm text-red">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender" />
        </div>
      ) : visibleHabits.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-ink-3 font-medium">No habits yet</p>
          <p className="text-sm text-ink-4 mt-1">Tap + to build your first habit</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              assignee={activeTab}
              todayCount={getTodayCount(habit.id, activeTab)}
              streak={getStreak(habit, activeTab)}
              kids={kidProfiles}
              completedDates={new Set(
                completions
                  .filter((c) => c.habit_id === habit.id && c.completed_by === activeTab)
                  .map((c) => c.date)
              )}
              onComplete={async () => {
                const result = await completeHabit(habit.id, activeTab);
                if (result.bonusAwarded) {
                  const kid = kidProfiles.find((k) => k.id === activeTab);
                  if (kid) fireForKids([kid.color]);
                  setBonusKidId(activeTab);
                  setTimeout(() => setBonusKidId(null), 3000);
                  void refreshRewards();
                }
              }}
              onUndo={() => void undoComplete(habit.id, activeTab)}
              onEdit={() => handleEdit(habit)}
            />
          ))}
        </div>
      )}

      <HabitModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingHabit(null); }}
        onSave={handleSave}
        onDelete={editingHabit ? handleDelete : undefined}
        habit={editingHabit}
        kids={kidProfiles}
      />
    </div>
  );
}
