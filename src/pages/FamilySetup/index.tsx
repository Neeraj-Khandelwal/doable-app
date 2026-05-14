import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamilyContext } from '../../context/FamilyContext';
import type { FamilyColor } from '../../utils/familyModels';

const COLORS: { name: FamilyColor; hex: string; label: string }[] = [
  { name: 'lavender', hex: '#b39ddb', label: 'Lavender' },
  { name: 'peach', hex: '#ffab91', label: 'Peach' },
  { name: 'mint', hex: '#80cbc4', label: 'Mint' },
  { name: 'sky', hex: '#81d4fa', label: 'Sky' },
  { name: 'amber', hex: '#ffd54f', label: 'Amber' },
  { name: 'rose', hex: '#f48fb1', label: 'Rose' },
];

const TOTAL_STEPS = 4;

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex justify-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i + 1 === current ? 'w-6 bg-violet-500' : 'w-2 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function StepFamilyName({ onNext }: { onNext: () => void }) {
  const { createFamily } = useFamilyContext();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (name.trim().length < 2) {
      setError('Family name must be at least 2 characters.');
      return;
    }
    setBusy(true);
    setError('');
    const result = await createFamily(name.trim());
    setBusy(false);
    if (result.error) {
      setError(result.error.message || 'Failed to create family.');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-3">🏠</div>
        <h2 className="text-2xl font-bold text-gray-900">Name your family</h2>
        <p className="text-gray-500 mt-1 text-sm">This is how your family will appear in the app.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Family Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. The Smith Family"
          maxLength={50}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 placeholder-gray-400"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <button
        onClick={handleCreate}
        disabled={busy || name.trim().length < 2}
        className="w-full py-3 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
      >
        {busy ? 'Creating…' : 'Create Family'}
      </button>
    </div>
  );
}

function StepAddKids({ onNext }: { onNext: () => void }) {
  const { kidProfiles, addKidProfile, removeKidProfile } = useFamilyContext();

  const [kidName, setKidName] = useState('');
  const [color, setColor] = useState<FamilyColor>('lavender');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(kidProfiles.length === 0);

  const handleAdd = async () => {
    if (kidName.trim().length < 1) {
      setError('Please enter a name.');
      return;
    }
    setBusy(true);
    setError('');
    const result = await addKidProfile(kidName.trim(), color);
    setBusy(false);
    if (result.error) {
      setError(result.error.message || 'Failed to add kid.');
      return;
    }
    setKidName('');
    setColor('lavender');
  };

  const handleRemove = async (id: string) => {
    const result = await removeKidProfile(id);
    if (result.error) {
      setError(result.error.message || 'Failed to remove kid.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-3">👶</div>
        <h2 className="text-2xl font-bold text-gray-900">Add your kids</h2>
        <p className="text-gray-500 mt-1 text-sm">You can skip this step and add them later.</p>
      </div>

      {kidProfiles.length > 0 && (
        <div className="space-y-3">
          {kidProfiles.map((kid) => (
            <div
              key={kid.id}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: COLORS.find((c) => c.name === kid.color)?.hex + '30' }}
            >
              <span className="font-medium text-gray-900">{kid.name}</span>
              <button
                onClick={() => handleRemove(kid.id)}
                className="text-red-600 hover:text-red-700 text-sm font-semibold"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="space-y-3">
          <input
            type="text"
            value={kidName}
            onChange={(e) => setKidName(e.target.value)}
            placeholder="Kid's name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pick a color</label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={`w-full h-10 rounded-lg border-2 transition ${
                    color === c.name ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleAdd}
            disabled={busy || kidName.trim().length === 0}
            className="w-full py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-semibold rounded-lg"
          >
            {busy ? 'Adding…' : 'Add Kid'}
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg"
        >
          {showForm ? 'Hide Form' : 'Add Another'}
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-2 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-lg"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StepPartnerInvite({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSendInvite = async () => {
    // TODO: Implement partner invite logic
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      onNext();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-3">👥</div>
        <h2 className="text-2xl font-bold text-gray-900">Invite your partner</h2>
        <p className="text-gray-500 mt-1 text-sm">You can skip this and invite them later.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Partner Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="partner@example.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onNext}
          className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-xl"
        >
          Skip
        </button>
        <button
          onClick={handleSendInvite}
          disabled={busy || !email}
          className="flex-1 py-3 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-semibold rounded-xl"
        >
          {busy ? 'Sending…' : 'Send Invite'}
        </button>
      </div>
    </div>
  );
}

function StepComplete({ onFinish }: { onFinish: () => void }) {
  const { family } = useFamilyContext();

  return (
    <div className="space-y-6 text-center">
      <div className="text-5xl">✨</div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">All set!</h2>
        <p className="text-gray-500 mt-2">Your family "{family?.name}" is ready to go.</p>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">Share this code with family members:</p>
        <p className="text-2xl font-bold text-violet-600 mt-2">{family?.invite_code}</p>
      </div>

      <button
        onClick={onFinish}
        className="w-full py-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl"
      >
        Go to Home
      </button>
    </div>
  );
}

export default function FamilySetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <StepDots current={step} />

        {step === 1 && <StepFamilyName onNext={handleNext} />}
        {step === 2 && <StepAddKids onNext={handleNext} />}
        {step === 3 && <StepPartnerInvite onNext={handleNext} />}
        {step === 4 && <StepComplete onFinish={handleFinish} />}
      </div>
    </div>
  );
}
