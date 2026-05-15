import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFamilyContext } from '../../context/FamilyContext';
import { useTaskContext } from '../../context/TaskContext';
import { parseDeepLink } from '../../utils/deepLinkHandler';
import { parseTaskText } from '../../utils/taskParser';
import TaskModal from '../../components/tasks/TaskModal';
import type { Task } from '../../utils/taskModels';

export default function VoiceCapture() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { kidProfiles } = useFamilyContext();
  const { createTask } = useTaskContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const payload = parseDeepLink(searchParams.toString() ? `?${searchParams.toString()}` : window.location.search);

    if (!payload) {
      setError('No action found in the link.');
      return;
    }

    if (payload.action === 'add_task') {
      const text = payload.text ?? '';
      if (!text.trim()) {
        setError('No task text provided.');
        return;
      }
      const parsed = parseTaskText(text, kidProfiles);
      setDraftTask({
        title: parsed.title,
        due_date: parsed.dueDate,
        assignees: parsed.assignees,
        priority: parsed.priority,
        category: parsed.category,
      });
      setModalOpen(true);
    } else if (payload.action === 'invite' && payload.code) {
      navigate(`/join?code=${payload.code}`);
    } else {
      setError(`Unknown action: ${payload.action}`);
    }
  // kidProfiles may change after mount but we only want to parse once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSave = async (data: Partial<Task>) => {
    await createTask(data);
    navigate('/tasks');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center gap-4">
        <span className="text-4xl">🔗</span>
        <p className="text-ink font-semibold">Something went wrong</p>
        <p className="text-sm text-ink-3">{error}</p>
        <button
          onClick={() => navigate('/home')}
          className="mt-2 px-5 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold"
        >
          Go Home
        </button>
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
