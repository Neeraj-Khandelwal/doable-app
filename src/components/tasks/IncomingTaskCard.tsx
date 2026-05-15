import { useState } from 'react';
import type { Task, TaskPriority } from '../../utils/taskModels';
import { CATEGORY_ICONS } from '../../utils/taskModels';

interface IncomingTaskCardProps {
  task: Task;
  creatorName: string;
  onAccept: (taskId: string) => Promise<void>;
  onReject: (taskId: string, reason: string) => Promise<void>;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: '#E85450',
  medium: '#E8A800',
  low: '#9CA3AF',
};

export default function IncomingTaskCard({ task, creatorName, onAccept, onReject }: IncomingTaskCardProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const due = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const handleAccept = async () => {
    setLoading(true);
    await onAccept(task.id);
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject(task.id, reason.trim());
    setLoading(false);
    setRejecting(false);
    setReason('');
  };

  return (
    <div className="bg-white rounded-xl border-2 border-amber/40 shadow-sm p-4"
      style={{ borderLeft: '4px solid #E8A800' }}
    >
      {/* From banner */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-bold text-amber bg-amber/10 px-2 py-0.5 rounded-full">
          📨 From {creatorName}
        </span>
      </div>

      {/* Task title + meta */}
      <p className="font-semibold text-gray-900 text-sm">{task.title}</p>
      {task.description && (
        <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {due && <span className="text-xs text-gray-500">📅 {due}</span>}
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        >
          {task.priority}
        </span>
        <span className="text-xs text-gray-400">
          {CATEGORY_ICONS[task.category]}
        </span>
      </div>

      {/* Rejection reason input */}
      {rejecting && (
        <div className="mt-3">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)..."
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose bg-gray-50"
            autoFocus
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        {!rejecting ? (
          <>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 py-2 bg-mint text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-opacity active:scale-95"
            >
              ✓ Accept
            </button>
            <button
              onClick={() => setRejecting(true)}
              disabled={loading}
              className="flex-1 py-2 bg-rose/10 text-rose font-bold text-sm rounded-xl border border-rose/30 disabled:opacity-50 transition-opacity active:scale-95"
            >
              ✕ Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { setRejecting(false); setReason(''); }}
              className="flex-1 py-2 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 py-2 bg-rose text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Rejecting…' : 'Confirm Reject'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
