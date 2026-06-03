import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFamilyContext } from '../context/FamilyContext';

export const GET_STARTED_KEY = 'doable_get_started_done';

export default function GetStarted() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createFamily } = useFamilyContext();

  const inviteCode = searchParams.get('code');

  useEffect(() => {
    // If arriving via invite deep link, go straight to join flow
    if (inviteCode) {
      navigate(`/join?code=${inviteCode}`, { replace: true });
    }
  }, [inviteCode, navigate]);

  const handleSolo = async () => {
    await createFamily('My Home');
    localStorage.setItem(GET_STARTED_KEY, '1');
    navigate('/onboarding');
  };

  const handleJoin = () => {
    navigate('/join');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: '#f3f0fd' }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <div className="text-center space-y-3">
          <div className="text-6xl" style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.10))' }}>🏠</div>
          <h1 className="text-2xl font-extrabold text-ink leading-tight">How would you like<br />to use Doable?</h1>
          <p className="text-sm text-ink-3 leading-relaxed">You can always invite family members later.</p>
        </div>

        <div className="w-full space-y-4">
          <button
            onClick={handleSolo}
            className="w-full flex flex-col items-start gap-1 bg-white rounded-2xl px-5 py-5 shadow-sm border-2 border-transparent hover:border-lavender active:scale-95 transition-all text-left"
          >
            <span className="text-2xl">👤</span>
            <span className="text-base font-extrabold text-ink">Just me</span>
            <span className="text-sm text-ink-3">Use Doable solo or invite family later</span>
          </button>

          <button
            onClick={handleJoin}
            className="w-full flex flex-col items-start gap-1 bg-white rounded-2xl px-5 py-5 shadow-sm border-2 border-transparent hover:border-lavender active:scale-95 transition-all text-left"
          >
            <span className="text-2xl">👨‍👩‍👧</span>
            <span className="text-base font-extrabold text-ink">Join a family</span>
            <span className="text-sm text-ink-3">I have an invite code from my partner</span>
          </button>
        </div>

      </div>
    </div>
  );
}
