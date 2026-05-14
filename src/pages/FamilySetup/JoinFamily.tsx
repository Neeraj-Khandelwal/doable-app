import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { useFamilyContext } from '../../context/FamilyContext';

function classifyError(err: any, enteredEmail: string, userEmail?: string): string {
  const msg = err?.message ?? '';

  if (msg.toLowerCase().includes('invalid invite code') || msg.includes('PGRST116')) {
    return 'That invite code is invalid or has expired. Double-check the code and try again.';
  }
  if (msg.toLowerCase().includes('already')) {
    return 'You are already a member of this family.';
  }
  if (enteredEmail && userEmail && enteredEmail.toLowerCase() !== userEmail.toLowerCase()) {
    return `You are signed in as ${userEmail}, but entered ${enteredEmail}. Please sign in with the correct account.`;
  }
  return msg || 'Something went wrong. Please try again.';
}

export default function JoinFamily() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthContext();
  const { joinFamily, family } = useFamilyContext();

  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) setCode(urlCode.toUpperCase());
  }, [searchParams]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const alreadyInFamily = !!family;

  const handleJoin = async () => {
    setError('');

    if (code.trim().length === 0) {
      setError('Please enter an invite code.');
      return;
    }

    if (email.trim() && user?.email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      setError(
        `You are signed in as ${user.email}, but entered ${email.trim()}. ` +
          `Please sign in with the correct account or clear the email field.`
      );
      return;
    }

    if (alreadyInFamily) {
      setError(`You are already a member of "${family?.name}". Leave that family first to join another.`);
      return;
    }

    setStatus('loading');
    const result = await joinFamily(code.trim());

    if (result.error) {
      setStatus('idle');
      setError(classifyError(result.error, email.trim(), user?.email));
      return;
    }

    setStatus('success');
    setTimeout(() => navigate('/home'), 1800);
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome to the family!</h2>
          <p className="text-gray-500 text-sm">Taking you home…</p>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👨‍👩‍👧‍👦</div>
          <h1 className="text-2xl font-bold text-gray-900">Join a Family</h1>
          <p className="text-gray-500 text-sm mt-2">Enter the invite code to join your family.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-center text-lg font-mono tracking-widest"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <button
            onClick={handleJoin}
            disabled={status === 'loading' || code.trim().length === 0}
            className="w-full py-3 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {status === 'loading' ? 'Joining…' : 'Join Family'}
          </button>

          <button
            onClick={() => navigate('/family')}
            className="w-full py-2 text-violet-600 hover:text-violet-700 font-semibold text-sm"
          >
            Back to Family
          </button>
        </div>
      </div>
    </div>
  );
}
