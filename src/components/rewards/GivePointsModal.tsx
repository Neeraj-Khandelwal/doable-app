import { useState, useEffect, useRef } from 'react';
import type { KidProfile } from '../../utils/familyModels';
import { pickPhoto, uploadMomentPhoto } from '../../services/photoService';

const KID_COLOR_MAP: Record<string, string> = {
  lavender: '#7C6FF0',
  peach: '#FF8F5E',
  mint: '#2EB87A',
  sky: '#2FA8E0',
  amber: '#E8A800',
  rose: '#E85450',
};

interface GivePointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kids: KidProfile[];
  defaultKidId?: string;
  userId: string;
  onSave: (kidId: string, points: number, reason: string, photoUrl?: string | null) => Promise<{ error?: string }>;
}

export default function GivePointsModal({ isOpen, onClose, kids, defaultKidId, userId, onSave }: GivePointsModalProps) {
  const [selectedKidId, setSelectedKidId] = useState(defaultKidId ?? kids[0]?.id ?? '');
  const [mode, setMode] = useState<'+' | '-'>('+');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Track previous open state so we only reset on open transition (false→true),
  // not when `kids` gets a new array reference (which happens on page refocus
  // after the camera/gallery picker closes, and would otherwise wipe the form).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setSelectedKidId(defaultKidId ?? kids[0]?.id ?? '');
      setMode('+');
      setAmount('');
      setReason('');
      setPhotoDataUrl(null);
      setPhotoBlob(null);
      setError('');
      setSaving(false);
    }
    wasOpenRef.current = isOpen;
  });

  if (!isOpen) return null;

  const handlePickPhoto = async (source: 'camera' | 'gallery') => {
    const result = await pickPhoto(source);
    if (!result) return;
    setPhotoDataUrl(result.dataUrl);
    setPhotoBlob(result.blob);
  };

  const handleSave = async () => {
    const pts = parseInt(amount);
    if (!pts || pts <= 0) { setError('Enter a valid number of points.'); return; }
    if (!reason.trim()) { setError('Enter a reason.'); return; }
    if (!selectedKidId) { setError('Select a kid.'); return; }

    setSaving(true);
    setError('');

    let photoUrl: string | null = null;
    if (photoBlob) {
      const { url, error: uploadError } = await uploadMomentPhoto(userId, photoBlob);
      if (uploadError) { setError(`Photo upload failed: ${uploadError}`); setSaving(false); return; }
      photoUrl = url ?? null;
    }

    const result = await onSave(selectedKidId, mode === '+' ? pts : -pts, reason.trim(), photoUrl);
    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      onClose();
    }
  };

  const QUICK_AMOUNTS = [1, 2, 5, 10];
  const QUICK_REASONS_POSITIVE = ['Kindness', 'Helping out', 'Great effort', 'Being responsible', 'Going above & beyond'];
  const QUICK_REASONS_NEGATIVE = ['Rule broken', 'Forgot chores', 'Unkind behavior'];
  const quickReasons = mode === '+' ? QUICK_REASONS_POSITIVE : QUICK_REASONS_NEGATIVE;

  const selectedKid = kids.find((k) => k.id === selectedKidId);
  const kidColor = selectedKid ? (KID_COLOR_MAP[selectedKid.color] ?? '#7C6FF0') : '#7C6FF0';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between py-3 mb-2">
            <h2 className="text-lg font-bold text-gray-900">Give Points</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none hover:text-gray-600">×</button>
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Kid selector */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Who</label>
            <div className="flex flex-wrap gap-2">
              {kids.map((kid) => {
                const color = KID_COLOR_MAP[kid.color] ?? '#7C6FF0';
                const selected = selectedKidId === kid.id;
                return (
                  <button
                    key={kid.id}
                    onClick={() => setSelectedKidId(kid.id)}
                    className="px-4 py-2 rounded-full text-sm font-bold border-2 transition-all"
                    style={selected
                      ? { backgroundColor: color, borderColor: color, color: '#fff' }
                      : { borderColor: '#e5e7eb', color: '#6b7280', backgroundColor: '#fff' }}
                  >
                    {kid.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* +/- toggle */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('+')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
                  mode === '+' ? 'bg-mint/10 border-mint text-mint' : 'border-gray-100 text-gray-400 bg-white'
                }`}
              >
                + Award
              </button>
              <button
                onClick={() => setMode('-')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
                  mode === '-' ? 'bg-rose/10 border-rose text-rose' : 'border-gray-100 text-gray-400 bg-white'
                }`}
              >
                − Deduct
              </button>
            </div>
          </div>

          {/* Points amount */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Points</label>
            <div className="flex gap-2 mb-2">
              {QUICK_AMOUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setAmount(String(n))}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl border-2 transition-all ${
                    amount === String(n)
                      ? mode === '+'
                        ? 'border-mint bg-mint/10 text-mint'
                        : 'border-rose bg-rose/10 text-rose'
                      : 'border-gray-100 text-gray-500 bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Custom amount"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
            />
          </div>

          {/* Reason */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {quickReasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    reason === r
                      ? 'bg-lavender/10 border-lavender text-lavender'
                      : 'border-gray-200 text-gray-500 bg-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Or type your own reason…"
              maxLength={100}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lavender bg-gray-50"
            />
          </div>

          {/* Photo capture — only in Award mode */}
          {mode === '+' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📷 Capture the moment <span className="font-normal text-gray-400">(optional)</span>
              </label>

              {photoDataUrl ? (
                <div className="relative">
                  <img
                    src={photoDataUrl}
                    alt="Moment"
                    className="w-full h-44 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={() => { setPhotoDataUrl(null); setPhotoBlob(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-black/80"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => void handlePickPhoto('camera')}
                    className="flex-1 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-lavender hover:text-lavender transition-colors"
                  >
                    📸 Camera
                  </button>
                  <button
                    onClick={() => void handlePickPhoto('gallery')}
                    className="flex-1 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-lavender hover:text-lavender transition-colors"
                  >
                    🖼️ Gallery
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {amount && parseInt(amount) > 0 && selectedKid && (
            <div
              className="mb-6 p-3 rounded-xl text-center text-sm font-semibold"
              style={{ backgroundColor: `${kidColor}15`, color: kidColor }}
            >
              {mode === '+' ? '+' : '−'}{amount} pts → {selectedKid.name}
              {reason ? ` · "${reason}"` : ''}
              {photoDataUrl ? ' · 📷' : ''}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 pt-3 pb-6 border-t border-gray-100 bg-white">
          <button
            onClick={handleSave}
            disabled={saving || !amount || !reason.trim()}
            className="w-full py-3 font-bold text-white rounded-xl disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: mode === '+' ? '#2EB87A' : '#E85450' }}
          >
            {saving
              ? (photoBlob ? 'Uploading photo…' : 'Saving…')
              : mode === '+' ? `Give ${amount || '?'} pts` : `Deduct ${amount || '?'} pts`}
          </button>
        </div>
      </div>
    </div>
  );
}
