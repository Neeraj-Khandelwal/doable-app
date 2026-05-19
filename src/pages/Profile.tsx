// Profile page component
import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Button, Input, Card, LoadingSpinner } from '../components/common';
import { useAppPermissions, type PermStatus } from '../hooks/useAppPermissions';

const PERM_META: Record<string, { icon: string; label: string; description: string }> = {
  notifications: {
    icon: '🔔',
    label: 'Notifications',
    description: 'Alarm reminders and family nudges',
  },
  microphone: {
    icon: '🎙️',
    label: 'Microphone',
    description: 'Voice task input',
  },
  camera: {
    icon: '📷',
    label: 'Camera & Photos',
    description: 'Reward images and habit photos',
  },
};

function PermissionRow({
  type,
  status,
  requesting,
  onRequest,
}: {
  type: string;
  status: PermStatus;
  requesting: boolean;
  onRequest: () => void;
}) {
  const meta = PERM_META[type];
  const isGranted = status === 'granted';
  const isDenied = status === 'denied';
  const isUnsupported = status === 'unsupported';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="text-2xl flex-shrink-0">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
        <p className="text-xs text-gray-500">{meta.description}</p>
      </div>
      {isUnsupported ? (
        <span className="text-xs text-gray-400 font-medium">N/A</span>
      ) : isGranted ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Allowed
        </span>
      ) : isDenied ? (
        <span className="text-xs font-semibold text-rose-500">Blocked</span>
      ) : (
        <Button
          onClick={onRequest}
          variant="outline"
          disabled={requesting}
          className="text-xs py-1 px-3 h-auto min-h-0"
        >
          {requesting ? '…' : 'Allow'}
        </Button>
      )}
    </div>
  );
}

const Profile = () => {
  const { user, signOut } = useAuthContext();
  const { permissions, requesting, requestPermission } = useAppPermissions();
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    timezone: 'UTC',
    total_points: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create default profile
        const defaultProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          timezone: 'UTC',
          total_points: 0,
        };
        setProfile(defaultProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert(profile);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-lavender rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {profile.full_name?.charAt(0)?.toUpperCase() ||
             user.email?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {profile.full_name || 'User Profile'}
        </h1>
        <p className="text-gray-600">{user.email}</p>
      </div>

      {/* Profile Form */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h2>

        {error && (
          <div className="mb-4 p-3 bg-rose/10 border border-rose rounded-md">
            <p className="text-rose text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-mint/10 border border-mint rounded-md">
            <p className="text-mint text-sm">{success}</p>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Full Name"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            placeholder="Enter your full name"
          />

          <Input
            label="Timezone"
            value={profile.timezone}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            placeholder="e.g., America/New_York"
          />

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Total Points:</span>
            <span className="text-lg font-bold text-amber">{profile.total_points}</span>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleSave}
            variant="primary"
            className="w-full"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </Card>

      {/* App Permissions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">App Permissions</h2>
        <p className="text-xs text-gray-500 mb-3">Grant permissions now so the app works smoothly when you need them.</p>
        {(Object.keys(PERM_META) as Array<keyof typeof PERM_META>).map((type) => (
          <PermissionRow
            key={type}
            type={type}
            status={permissions[type as keyof typeof permissions]}
            requesting={requesting === type}
            onRequest={() => requestPermission(type as 'notifications' | 'microphone' | 'camera')}
          />
        ))}
        {permissions.notifications === 'denied' || permissions.microphone === 'denied' || permissions.camera === 'denied' ? (
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            ⚙️ To unblock a permission, go to your browser or device settings → find Doable → allow the permission, then refresh.
          </p>
        ) : null}
      </Card>

      {/* Account Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-3">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </Card>

      {/* App Info */}
      <Card>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Doable App</h3>
          <p className="text-sm text-gray-600 mb-4">
            Version 1.0.0 - Making life more organized, one task at a time.
          </p>
          <div className="text-xs text-gray-500">
            Built with React, Tailwind CSS, and Supabase
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;