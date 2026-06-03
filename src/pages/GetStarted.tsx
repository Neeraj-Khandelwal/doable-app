import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFamilyContext } from '../context/FamilyContext';
import { ONBOARDING_KEY } from './Onboarding';

export const GET_STARTED_KEY = 'doable_get_started_done';

export default function GetStarted() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createFamily } = useFamilyContext();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const inviteCode = searchParams.get('code');

  useEffect(() => {
    if (inviteCode) {
      navigate(`/join?code=${inviteCode}`, { replace: true });
    }
  }, [inviteCode, navigate]);

  const handleSolo = async () => {
    setBusy(true);
    setError('');
    const result = await createFamily('My Home');
    setBusy(false);
    if (result.error) {
      setError('Something went wrong. Please try again.');
      return;
    }
    localStorage.setItem(GET_STARTED_KEY, '1');
    navigate('/onboarding');
  };

  const handleCreateFamily = () => {
    navigate('/family-setup');
  };

  const handleJoin = () => {
    navigate('/join');
  };

  const handleSkip = () => {
    localStorage.setItem(GET_STARTED_KEY, '1');
    const destination = localStorage.getItem(ONBOARDING_KEY) ? '/home' : '/onboarding';
    navigate(destination);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: '#f3f0fd' }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <div className="text-center space-y-3">
          <div className="text-6xl" style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.10))' }}>🏠</div>
          <h1 className="text-2xl font-extrabold text-ink leading-tight">How would you like<br />to use Doable?</h1>
          <p className="text-sm text-ink-3 leading-relaxed">You can always change this later.</p>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={handleSolo}
            disabled={busy}
            className="w-full flex flex-col items-start gap-1 bg-white rounded-2xl px-5 py-5 shadow-sm border-2 border-transparent hover:border-lavender active:scale-95 transition-all text-left disabled:opacity-60"
          >
            <span className="text-2xl">👤</span>
            <span className="text-base font-extrabold text-ink">
              {busy ? 'Setting up…' : 'Just me'}
            </span>
            <span className="text-sm text-ink-3">Use Doable solo — no family setup needed</span>
          </button>

          <button
            onClick={handleCreateFamily}
            disabled={busy}
            className="w-full flex flex-col items-start gap-1 bg-white rounded-2xl px-5 py-5 shadow-sm border-2 border-transparent hover:border-lavender active:scale-95 transition-all text-left disabled:opacity-60"
          >
            <span className="text-2xl">👨‍👩‍👧</span>
            <span className="text-base font-extrabold text-ink">Create a family</span>
            <span className="text-sm text-ink-3">Name your family, add kids, invite your partner</span>
          </button>

          <button
            onClick={handleJoin}
            disabled={busy}
            className="w-full flex flex-col items-start gap-1 bg-white rounded-2xl px-5 py-5 shadow-sm border-2 border-transparent hover:border-lavender active:scale-95 transition-all text-left disabled:opacity-60"
          >
            <span className="text-2xl">🔗</span>
            <span className="text-base font-extrabold text-ink">Join a family</span>
            <span className="text-sm text-ink-3">I have an invite code from my partner</span>
          </button>
        </div>

        {error && (
          <p className="text-sm text-rose font-medium text-center">{error}</p>
        )}

        <button
          onClick={handleSkip}
          disabled={busy}
          className="text-sm text-ink-3 hover:text-ink transition-colors"
        >
          Skip for now
        </button>

      </div>
    </div>
  );
}
