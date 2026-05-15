import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFamilyContext } from '../../context/FamilyContext';
import { useTaskContext } from '../../context/TaskContext';
import { parseDeepLink } from '../../utils/deepLinkHandler';
import { parseTaskText, findTaskByTitle } from '../../utils/taskParser';
import TaskModal from '../../components/tasks/TaskModal';
import type { Task } from '../../utils/taskModels';

export default function VoiceCapture() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { kidProfiles } = useFamilyContext();
  const { createTask, markComplete, tasks } = useTaskContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task> | null>(null);
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const payload = parseDeepLink(searchParams.toString() ? `?${searchParams.toString()}` : window.location.search);

    if (!payload) {
      setError('No action found in the link.');
      return;
    }

    if (payload.action === 'add_task') {
      const text = payload.text ?? '';
      if (!text.trim()) { setError('No task text provided.'); return; }
      const parsed = parseTaskText(text, kidProfiles);
      setDraftTask({
        title: parsed.title,
        due_date: parsed.dueDate,
        assignees: parsed.assignees,
        priority: parsed.priority,
        category: parsed.category,
      });
      setModalOpen(true);
    } else if (payload.action === 'complete_task') {
      const text = payload.text ?? '';
      if (!text.trim()) { setError('No task name provided.'); return; }
      const found = findTaskByTitle(text, tasks);
      if (!found) {
        setError(`Couldn't find an active task matching "${text}".`);
        return;
      }
      setConfirmTask(found);
    } else if (payload.action === 'invite' && payload.code) {
      navigate(`/join?code=${payload.code}`);
    } else {
      setError(`Unknown action: ${payload.action}`);
    }
  // kidProfiles / tasks may change after mount but we only want to parse once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSave = async (data: Partial<Task>) => {
    await createTask(data);
    navigate('/tasks');
  };

  const handleConfirmComplete = async () => {
    if (!confirmTask) return;
    setCompleting(true);
    await markComplete(confirmTask.id);
    navigate('/tasks');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center gap-4">
        <span className="text-4xl">🔗</span>
        <p className="text-ink font-semibold">Something went wrong</p>
        <p className="text-sm text-ink-3">{error}</p>
        <button onClick={() => navigate('/home')} className="mt-2 px-5 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold">
          Go Home
        </button>
      </div>
    );
  }

  if (confirmTask) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center gap-4">
        <span className="text-5xl">✅</span>
        <p className="text-ink font-bold text-lg">Mark as done?</p>
        <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 w-full max-w-sm text-left">
          <p className="font-semibold text-ink">{confirmTask.title}</p>
          {confirmTask.due_date && (
            <p className="text-xs text-ink-3 mt-1">Due {confirmTask.due_date}</p>
          )}
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={() => navigate('/tasks')}
            className="flex-1 py-3 border-2 border-line rounded-xl text-sm font-bold text-ink-3 hover:bg-bg-deep transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleConfirmComplete()}
            disabled={completing}
            className="flex-1 py-3 bg-mint text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {completing ? 'Marking…' : 'Yes, done!'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background while modal loads */}
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lavender" />
      </div>

      {draftTask && (
        <TaskModal
          isOpen={modalOpen}
          onClose={() => navigate('/tasks')}
          onSave={handleSave}
          task={draftTask as Task}
          kids={kidProfiles}
        />
      )}
    </>
  );
}
