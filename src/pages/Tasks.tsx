import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTaskContext, type TaskFilter } from '../context/TaskContext';
import { useFamilyContext } from '../context/FamilyContext';
import { useAuthContext } from '../context/AuthContext';
import { isKidTask } from '../utils/taskModels';
import type { Task } from '../utils/taskModels';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';
import RatingModal from '../components/tasks/RatingModal';
import IncomingTaskCard from '../components/tasks/IncomingTaskCard';
import CalendarView from '../components/tasks/CalendarView';
import { useConfetti } from '../hooks/useConfetti';

const FILTER_TABS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'done', label: 'Done' },
  { key: 'high', label: '🔥 High' },
];

const KID_COLOR_MAP: Record<string, string> = {
  lavender: '#7C6FF0',
  peach: '#FF8F5E',
  mint: '#2EB87A',
  sky: '#2FA8E0',
  amber: '#E8A800',
  rose: '#E85450',
};

export default function Tasks() {
  const { filteredTasks, tasks, loading, error, filter, setFilter, createTask, updateTask, deleteTask, markComplete, rateAndComplete, acceptTask, rejectTask } = useTaskContext();
  const { family, kidProfiles, familyMembers } = useFamilyContext();
  const { user } = useAuthContext();

  const { fire, fireForKids } = useConfetti();
  const location = useLocation();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [ratingTask, setRatingTask] = useState<Task | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Derive partner from family members
  const partner = useMemo(() => {
    const partnerMember = familyMembers.find((m) => m.user_id !== user?.id);
    if (!partnerMember) return null;
    return { userId: partnerMember.user_id, name: partnerMember.display_name ?? 'Partner' };
  }, [familyMembers, user?.id]);

  // Tasks where current user is the assignee and status is pending
  const incomingTasks = useMemo(() =>
    tasks.filter(
      (t) => t.assigned_to_user_id === user?.id && t.assignment_status === 'pending_acceptance'
    ),
    [tasks, user?.id]
  );

  useEffect(() => {
    if ((location.state as { openModal?: boolean } | null)?.openModal) {
      setEditingTask(null);
      setModalOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const handleCompletePress = (task: Task) => {
    if (isKidTask(task)) {
      setRatingTask(task);
    } else {
      void markComplete(task.id).then(() => fire());
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<Task>) => {
    let result;
    if (editingTask) {
      result = await updateTask(editingTask.id, data);
    } else {
      result = await createTask(data);
    }
    if (result?.error) throw new Error(result.error);
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = async () => {
    if (!editingTask) return;
    const result = await deleteTask(editingTask.id);
    if (result?.error) throw new Error(result.error);
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleRatingConfirm = async (ratings: { kid_id: string; rating_type: any }[]) => {
    if (ratingTask) {
      await rateAndComplete(ratingTask.id, ratings);
      const assignedColors = kidProfiles
        .filter((k) => ratings.some((r) => r.kid_id === k.id))
        .map((k) => k.color);
      fireForKids(assignedColors);
      setRatingTask(null);
    }
  };

  const handleAccept = async (taskId: string) => {
    await acceptTask(taskId);
    fire();
  };

  const handleReject = async (taskId: string, reason: string) => {
    await rejectTask(taskId, reason);
  };

  // Assignee filter — also includes tasks assigned TO current user
  const assigneeFiltered = useMemo(() => {
    if (assigneeFilter === 'all') return filteredTasks;
    if (assigneeFilter === 'me') {
      return filteredTasks.filter(
        (t) => t.assignees.includes('me') || t.assigned_to_user_id === user?.id
      );
    }
    return filteredTasks.filter((t) => t.assignees.includes(assigneeFilter));
  }, [filteredTasks, assigneeFilter, user?.id]);

  // Exclude incoming (pending) tasks from the main list — shown separately
  const mainTasks = useMemo(() =>
    assigneeFiltered.filter(
      (t) => !(t.assigned_to_user_id === user?.id && t.assignment_status === 'pending_acceptance')
    ),
    [assigneeFiltered, user?.id]
  );

  const activeTasks = mainTasks.filter((t) => !t.completed_at);
  const doneTasks = mainTasks.filter((t) => !!t.completed_at);

  // Creator name for incoming task cards
  const getCreatorName = (task: Task) => {
    if (task.created_by === partner?.userId) return partner.name;
    return 'Someone';
  };

  if (!loading && !family) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-extrabold text-ink mb-2">No family yet</h2>
        <p className="text-sm text-ink-3 mb-6">Create or join a family to start adding tasks.</p>
        <button
          onClick={() => navigate('/family')}
          className="px-6 py-3 bg-lavender text-white font-bold rounded-2xl hover:opacity-90 transition-all active:scale-95"
        >
          Go to Family tab
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Tasks</h1>
          <p className="text-sm text-ink-3 mt-0.5">{activeTasks.length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all border-2 ${
              viewMode === 'calendar'
                ? 'bg-lavender border-lavender text-white'
                : 'border-line text-ink-3 bg-white'
            }`}
            aria-label="Toggle calendar view"
            title="Calendar view"
          >
            📅
          </button>
          <button
            onClick={handleAdd}
            className="w-11 h-11 bg-ink text-bg rounded-2xl text-xl font-bold flex items-center justify-center hover:opacity-80 transition-all active:scale-95"
            aria-label="Add task"
          >
            +
          </button>
        </div>
      </div>

      {/* Incoming tasks — response needed */}
      {incomingTasks.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-2">
            📨 Response Needed ({incomingTasks.length})
          </h2>
          <div className="space-y-3">
            {incomingTasks.map((task) => (
              <IncomingTaskCard
                key={task.id}
                task={task}
                creatorName={getCreatorName(task)}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Person tabs */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          onClick={() => setAssigneeFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
            assigneeFilter === 'all'
              ? 'bg-lavender border-lavender text-white'
              : 'border-line text-ink-3 bg-white'
          }`}
        >
          Everyone
        </button>
        <button
          onClick={() => setAssigneeFilter('me')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
            assigneeFilter === 'me'
              ? 'bg-lavender border-lavender text-white'
              : 'border-line text-ink-3 bg-white'
          }`}
        >
          Me
        </button>
        {kidProfiles.map((kid) => {
          const color = KID_COLOR_MAP[kid.color] ?? '#7C6FF0';
          const active = assigneeFilter === kid.id;
          return (
            <button
              key={kid.id}
              onClick={() => setAssigneeFilter(kid.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
              style={
                active
                  ? { backgroundColor: color, borderColor: color, color: '#fff' }
                  : { borderColor: '#EAE2D2', color: '#6E665E', backgroundColor: '#fff' }
              }
            >
              {kid.name}
            </button>
          );
        })}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-bg-deep rounded-xl p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              filter === tab.key
                ? 'bg-white text-lavender shadow-sm'
                : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-soft border border-red/20 rounded-xl text-sm text-red">
          {error}
        </div>
      )}

      {viewMode === 'calendar' ? (
        <CalendarView
          tasks={tasks}
          kids={kidProfiles}
          currentUserId={user?.id}
          onComplete={handleCompletePress}
          onEdit={handleEdit}
          onDelete={(id) => void deleteTask(id)}
          onReassign={(t) => { setEditingTask(t); setModalOpen(true); }}
        />
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender" />
        </div>
      ) : activeTasks.length === 0 && doneTasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-ink-3 font-medium">
            {filter === 'done' ? 'No completed tasks' :
             filter === 'high' ? 'No high priority tasks' :
             assigneeFilter !== 'all' ? 'No tasks for this person' :
             'No tasks yet'}
          </p>
          <p className="text-sm text-ink-4 mt-1">Tap + to add your first task</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              kids={kidProfiles}
              currentUserId={user?.id}
              onComplete={handleCompletePress}
              onEdit={handleEdit}
              onDelete={(id) => void deleteTask(id)}
              onReassign={(t) => { setEditingTask(t); setModalOpen(true); }}
            />
          ))}

          {doneTasks.length > 0 && filter !== 'active' && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 h-px bg-line" />
                <span className="text-xs text-ink-4 font-medium">
                  Completed ({doneTasks.length})
                </span>
                <div className="flex-1 h-px bg-line" />
              </div>
              {doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  kids={kidProfiles}
                  currentUserId={user?.id}
                  onComplete={handleCompletePress}
                  onEdit={handleEdit}
                  onDelete={(id) => void deleteTask(id)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Fixed FAB (mobile fallback) */}
      <button
        onClick={handleAdd}
        className="fixed bottom-24 right-4 w-14 h-14 bg-ink text-bg rounded-2xl shadow-lg text-2xl font-bold flex items-center justify-center hover:opacity-80 transition-all active:scale-95 z-40 sm:hidden"
        aria-label="Add task"
      >
        +
      </button>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        onDelete={editingTask ? handleDelete : undefined}
        task={editingTask}
        kids={kidProfiles}
        partner={partner}
      />

      <RatingModal
        isOpen={!!ratingTask}
        onClose={() => setRatingTask(null)}
        onConfirm={handleRatingConfirm}
        task={ratingTask}
        kids={kidProfiles}
      />
    </div>
  );
}
