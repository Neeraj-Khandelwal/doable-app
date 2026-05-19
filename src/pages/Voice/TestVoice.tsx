import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamilyContext } from '../../context/FamilyContext';
import { useTaskContext } from '../../context/TaskContext';
import { parseTaskText } from '../../utils/taskParser';
import type { TaskPriority } from '../../utils/taskModels';

interface ISpeechRecognition extends EventTarget {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string }; isFinal: boolean; length: number }; length: number }; resultIndex: number }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  high: '#E85450',
  medium: '#E8A800',
  low: '#9CA3AF',
};

type CreatedTask = { title: string; dueDate?: string | null; priority: TaskPriority };

export default function VoiceTaskScreen() {
  const navigate = useNavigate();
  const { kidProfiles, familyMembers } = useFamilyContext();
  const { createTask } = useTaskContext();

  const [micState, setMicState] = useState<'idle' | 'listening' | 'stopped'>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseTaskText> | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(['me']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [micBlocked, setMicBlocked] = useState(false);
  const [createdTasks, setCreatedTasks] = useState<CreatedTask[]>([]);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const handledRef = useRef(false);

  const SpeechAPI =
    typeof window !== 'undefined'
      ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
      : null;

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const startMic = () => {
    if (!SpeechAPI) { setError('Voice not supported on this device.'); return; }
    setTranscript('');
    setParsed(null);
    setError('');
    setMicBlocked(false);
    handledRef.current = false;
    setMicState('listening');

    const r = new SpeechAPI();
    r.lang = 'en-US';
    r.continuous = true;       // keep listening until user taps stop
    r.interimResults = true;   // show live transcript as user speaks
    r.maxAlternatives = 1;
    recognitionRef.current = r;

    let finalText = '';

    r.onresult = (e) => {
      // Only process results from resultIndex onward — starting from 0 would
      // re-add already-finalized segments and duplicate the transcript.
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result[0]) {
          if (result.isFinal) {
            finalText += result[0].transcript + ' ';
          } else {
            interim = result[0].transcript;
          }
        }
      }
      setTranscript((finalText + interim).trim());
    };

    r.onerror = (e) => {
      if (e.error === 'aborted') return;
      if (e.error === 'not-allowed') {
        setMicBlocked(true);
        setMicState('idle');
        return;
      }
      setError(e.error === 'no-speech' ? 'No speech detected. Try again.' : `Mic error: ${e.error}`);
      setMicState('idle');
    };

    r.onend = () => {
      const text = finalText.trim() || transcript;
      if (text) {
        setTranscript(text);
        setParsed(parseTaskText(text, kidProfiles));
        setSelectedAssignees(['me']); // always reset to Me
        setMicState('stopped');
      } else {
        setMicState('idle');
      }
    };

    r.start();
  };

  const stopMic = () => {
    recognitionRef.current?.stop(); // triggers onend → finalizes
  };

  const handleCreate = async () => {
    if (!parsed) return;
    setSaving(true);
    setError('');
    const result = await createTask({
      title: parsed.title,
      assignees: selectedAssignees,
      due_date: parsed.dueDate ?? null,
      priority: parsed.priority,
      category: parsed.category,
      is_private: true,
    });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setCreatedTasks((prev) => [{ title: parsed.title, dueDate: parsed.dueDate, priority: parsed.priority }, ...prev]);
      setTranscript('');
      setParsed(null);
      setSelectedAssignees(['me']);
      setMicState('idle');
    }
  };

  const reset = () => {
    recognitionRef.current?.abort();
    setTranscript('');
    setParsed(null);
    setSelectedAssignees(['me']);
    setMicState('idle');
    setError('');
    setMicBlocked(false);
  };

  const toggleAssignee = (id: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

return (
    <div className="min-h-screen bg-bg flex flex-col px-4 pt-5 pb-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-ink-3 hover:text-ink transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-5 h-5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-ink">Voice Tasks</h1>
          <p className="text-xs text-ink-4">Tap mic · speak · confirm</p>
        </div>
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <button
          onClick={micState === 'listening' ? stopMic : startMic}
          disabled={micState === 'stopped'}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
            micState === 'listening'
              ? 'bg-rose animate-pulse'
              : micState === 'stopped'
              ? 'bg-mint'
              : 'bg-lavender hover:opacity-90'
          }`}
        >
          {micState === 'listening' ? (
            /* Stop/pause icon */
            <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
              <rect x="6" y="4" width="4" height="16" rx="2" />
              <rect x="14" y="4" width="4" height="16" rx="2" />
            </svg>
          ) : (
            /* Mic icon */
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.75}
              strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
            </svg>
          )}
        </button>

        <p className="text-sm font-semibold text-ink-3">
          {micState === 'listening' ? '🔴 Listening… tap to stop' :
           micState === 'stopped'   ? '✅ Got it — confirm below' :
           SpeechAPI ? 'Tap to start speaking' : 'Voice not supported'}
        </p>
      </div>

      {/* Microphone permission denied */}
      {micBlocked && (
        <div className="mb-4 bg-rose/10 border border-rose/30 rounded-2xl p-4 flex gap-3 items-start">
          <span className="text-2xl flex-shrink-0">🎙️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-rose">Microphone access blocked</p>
            <p className="text-xs text-rose/80 mt-1 leading-relaxed">
              Please allow microphone access to use voice input.
            </p>
            <p className="text-xs text-ink-3 mt-2 leading-relaxed">
              In Chrome: tap the <strong>🔒 lock icon</strong> in the address bar → <strong>Microphone</strong> → <strong>Allow</strong>, then refresh the page.
            </p>
          </div>
        </div>
      )}

      {/* Generic errors */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-rose/10 border border-rose/30 rounded-xl text-sm text-rose font-medium text-center">
          {error}
        </div>
      )}

      {/* Transcript + parsed preview */}
      {transcript && parsed && (
        <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 mb-4 space-y-3">
          {/* What was heard */}
          <div>
            <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-1">You said</p>
            <p className="text-sm text-ink italic">"{transcript}"</p>
          </div>

          {/* Parsed fields */}
          <div className="bg-bg rounded-xl p-3 space-y-2">
            <Row label="Task" value={parsed.title} bold />
            {parsed.dueDate && <Row label="Due" value={parsed.dueDate} />}
            <Row label="Priority" value={parsed.priority} color={PRIORITY_COLOR[parsed.priority]} />
          </div>

          {/* Assignee picker */}
          <div>
            <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-2">Assign to</p>
            <div className="flex flex-wrap gap-2">
              {/* Me pill */}
              <button
                onClick={() => toggleAssignee('me')}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                  selectedAssignees.includes('me')
                    ? 'bg-lavender text-white border-lavender'
                    : 'bg-white text-ink-3 border-line'
                }`}
              >
                Me
              </button>
              {/* Kid pills */}
              {kidProfiles.map((kid) => {
                const color = { lavender:'#7C6FF0', peach:'#FF8F5E', mint:'#2EB87A', sky:'#2FA8E0', amber:'#E8A800', rose:'#E85450' }[kid.color] ?? '#7C6FF0';
                const selected = selectedAssignees.includes(kid.id);
                return (
                  <button
                    key={kid.id}
                    onClick={() => toggleAssignee(kid.id)}
                    className="px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all"
                    style={selected
                      ? { backgroundColor: color, borderColor: color, color: '#fff' }
                      : { borderColor: color, color: color, backgroundColor: 'transparent' }}
                  >
                    {kid.name}
                  </button>
                );
              })}
              {/* Partner pill */}
              {familyMembers.filter(m => m.role !== 'owner').map(m => (
                <button
                  key={m.user_id}
                  onClick={() => toggleAssignee(m.user_id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                    selectedAssignees.includes(m.user_id)
                      ? 'bg-sky text-white border-sky'
                      : 'bg-white text-sky border-sky'
                  }`}
                >
                  {m.display_name?.split(' ')[0] ?? 'Partner'}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex-1 py-2.5 border-2 border-line rounded-xl text-sm font-bold text-ink-3 hover:bg-bg-deep transition-colors"
            >
              Redo
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-2 flex-1 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? 'Adding…' : '✓ Add Task'}
            </button>
          </div>
        </div>
      )}

      {/* Manual text fallback */}
      {micState === 'idle' && !transcript && (
        <ManualInput
          onAdd={async (text) => {
            const p = parseTaskText(text, kidProfiles);
            setSaving(true);
            const result = await createTask({
              title: p.title,
              assignees: p.assignees.length ? p.assignees : ['me'],
              due_date: p.dueDate ?? null,
              priority: p.priority,
              category: p.category,
              is_private: true,
            });
            setSaving(false);
            if (!result?.error) {
              setCreatedTasks((prev) => [{ title: p.title, dueDate: p.dueDate, priority: p.priority }, ...prev]);
            }
          }}
          saving={saving}
        />
      )}

      {/* Tasks created this session */}
      {createdTasks.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold text-ink-4 uppercase tracking-wider mb-3">
            Added this session ({createdTasks.length})
          </p>
          <div className="space-y-2">
            {createdTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-line-soft shadow-sm">
                <span className="text-mint text-base flex-shrink-0">✓</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{t.title}</p>
                  {t.dueDate && <p className="text-xs text-ink-4">📅 {t.dueDate}</p>}
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: PRIORITY_COLOR[t.priority] }}
                >
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ManualInput({ onAdd, saving }: { onAdd: (text: string) => Promise<void>; saving: boolean }) {
  const [val, setVal] = useState('');
  const handleAdd = async () => {
    if (!val.trim()) return;
    await onAdd(val.trim());
    setVal('');
  };
  return (
    <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-2">
      <p className="text-xs font-bold text-ink-4 uppercase tracking-wider">Or type a task</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. Buy milk tomorrow"
          className="flex-1 px-3 py-2.5 bg-bg border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-lavender"
        />
        <button
          onClick={handleAdd}
          disabled={!val.trim() || saving}
          className="px-4 py-2.5 bg-lavender text-white rounded-xl text-sm font-bold disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-4">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-ink' : 'font-medium text-ink-2'}`} style={color ? { color } : {}}>
        {value}
      </span>
    </div>
  );
}
