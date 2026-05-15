import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildDeepLink } from '../../utils/deepLinkHandler';
import { parseTaskText } from '../../utils/taskParser';
import { useFamilyContext } from '../../context/FamilyContext';

const EXAMPLES = [
  'Buy milk',
  'Buy groceries tomorrow',
  'Study tonight for Mayra',
  'Clean the room today high priority',
  'Exercise next week',
  'Pay electricity bill',
  'All kids tidy up their toys',
  'Urgent dentist appointment tomorrow',
];

export default function TestVoice() {
  const navigate = useNavigate();
  const { kidProfiles } = useFamilyContext();
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof parseTaskText> | null>(null);

  const handlePreview = (text: string) => {
    const parsed = parseTaskText(text, kidProfiles);
    setPreview(parsed);
    setInput(text);
  };

  const handleLaunch = () => {
    if (!input.trim()) return;
    const url = buildDeepLink({ action: 'add_task', text: input.trim() });
    navigate(url);
  };

  const getAssigneeLabel = (id: string) => {
    if (id === 'me') return 'Me';
    return kidProfiles.find((k) => k.id === id)?.name ?? id;
  };

  return (
    <div className="min-h-screen bg-bg px-4 py-6 max-w-md mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">🎙 Voice Test</h1>
        <p className="text-sm text-ink-3 mt-0.5">Simulate Google Assistant voice commands</p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-3">
        <label className="text-xs font-bold text-ink-3 uppercase tracking-wider">Task text</label>
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setPreview(null); }}
          onKeyDown={(e) => e.key === 'Enter' && handlePreview(input)}
          placeholder="e.g. Buy milk tomorrow for Mayra"
          className="w-full px-4 py-3 bg-bg-deep border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-lavender"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handlePreview(input)}
            disabled={!input.trim()}
            className="flex-1 py-2.5 border-2 border-lavender text-lavender rounded-xl text-sm font-bold disabled:opacity-40"
          >
            Preview Parse
          </button>
          <button
            onClick={handleLaunch}
            disabled={!input.trim()}
            className="flex-1 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold disabled:opacity-40"
          >
            Launch →
          </button>
        </div>
      </div>

      {/* Parse preview */}
      {preview && (
        <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-2">
          <p className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-1">Parsed result</p>
          <Row label="Title" value={preview.title} />
          <Row label="Due date" value={preview.dueDate ?? '—'} />
          <Row label="Assignees" value={preview.assignees.map(getAssigneeLabel).join(', ')} />
          <Row label="Priority" value={preview.priority} />
          <Row label="Category" value={preview.category} />
        </div>
      )}

      {/* Example commands */}
      <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-2">
        <p className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-1">Example commands</p>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => handlePreview(ex)}
            className="w-full text-left px-3 py-2 rounded-xl bg-bg-deep hover:bg-plum-soft text-sm text-ink-2 transition-colors"
          >
            "{ex}"
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-line-soft last:border-0">
      <span className="text-xs text-ink-4">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
