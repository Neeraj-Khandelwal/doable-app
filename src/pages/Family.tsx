import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFamilyContext } from '../context/FamilyContext';
import { useAuthContext } from '../context/AuthContext';
import { useTaskContext } from '../context/TaskContext';
import { useHabitContext } from '../context/HabitContext';
import { useRewardsContext } from '../context/RewardsContext';
import { supabase } from '../supabaseClient';
import type { FamilyColor } from '../utils/familyModels';
import { useAppPermissions, type PermStatus } from '../hooks/useAppPermissions';

type Tab = 'family' | 'account';

const COLOR_OPTIONS: { name: FamilyColor; hex: string; ring: string; bg: string }[] = [
  { name: 'lavender', hex: '#7C6FF0', ring: '#b39ddb', bg: '#f3f0fd' },
  { name: 'peach',    hex: '#FF8F5E', ring: '#ffab91', bg: '#fff3ef' },
  { name: 'mint',     hex: '#2EB87A', ring: '#80cbc4', bg: '#edfaf4' },
  { name: 'sky',      hex: '#2FA8E0', ring: '#81d4fa', bg: '#e8f6fd' },
  { name: 'amber',    hex: '#E8A800', ring: '#ffd54f', bg: '#fef9e7' },
  { name: 'rose',     hex: '#E85450', ring: '#f48fb1', bg: '#fef0f0' },
];

const colorFor = (name: FamilyColor) => COLOR_OPTIONS.find((c) => c.name === name) ?? COLOR_OPTIONS[0];

const PERM_META: Record<string, { icon: string; label: string; description: string }> = {
  notifications: { icon: '🔔', label: 'Notifications', description: 'Alarm reminders and family nudges' },
  microphone:    { icon: '🎙️', label: 'Microphone',    description: 'Voice task input' },
  camera:        { icon: '📷', label: 'Camera & Photos', description: 'Reward images and habit photos' },
};

function PermissionRow({ type, status, requesting, onRequest }: {
  type: string; status: PermStatus; requesting: boolean; onRequest: () => void;
}) {
  const meta = PERM_META[type];
  return (
    <div className="flex items-center gap-3 py-3 border-b border-line-soft last:border-0">
      <span className="text-xl flex-shrink-0">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{meta.label}</p>
        <p className="text-xs text-ink-4">{meta.description}</p>
      </div>
      {status === 'unsupported' ? (
        <span className="text-xs text-ink-4">N/A</span>
      ) : status === 'granted' ? (
        <span className="text-xs font-semibold text-mint flex items-center gap-1">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Allowed
        </span>
      ) : status === 'denied' ? (
        <span className="text-xs font-semibold text-rose">Blocked</span>
      ) : (
        <button
          onClick={onRequest}
          disabled={requesting}
          className="px-3 py-1.5 bg-lavender text-white text-xs font-bold rounded-full disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {requesting ? '…' : 'Allow'}
        </button>
      )}
    </div>
  );
}

export default function Family() {
  const {
    family, familyMembers, kidProfiles, loading, error, isOwner,
    createFamily, joinFamily, generateInviteCode,
    addKidProfile, updateKidProfile, removeKidProfile, updateFamilyMember,
  } = useFamilyContext();
  const { user, signOut } = useAuthContext();
  const { resetAllTasks } = useTaskContext();
  const { resetHabitProgress } = useHabitContext();
  const { resetAllRewardData } = useRewardsContext();
  const { permissions, requesting, requestPermission } = useAppPermissions();

  const [resetConfirm, setResetConfirm] = useState<'tasks' | 'habits' | 'rewards' | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState<string | null>(null);

  const handleReset = async (type: 'tasks' | 'habits' | 'rewards') => {
    setResetting(true);
    const fn = type === 'tasks' ? resetAllTasks : type === 'habits' ? resetHabitProgress : resetAllRewardData;
    await fn();
    setResetting(false);
    setResetConfirm(null);
    setResetDone(type);
    setTimeout(() => setResetDone(null), 3000);
  };

  const location = useLocation();
  const [tab, setTab] = useState<Tab>(
    (location.state as { tab?: Tab } | null)?.tab ?? 'family'
  );

  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [showAddKid, setShowAddKid] = useState(false);
  const [kidName, setKidName] = useState('');
  const [kidColor, setKidColor] = useState<FamilyColor>('lavender');

  const [editingKidId, setEditingKidId] = useState<string | null>(null);
  const [editKidName, setEditKidName] = useState('');
  const [editKidColor, setEditKidColor] = useState<FamilyColor>('lavender');

  const [fullName, setFullName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [running, setRunning] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
        else setFullName((user.user_metadata as { full_name?: string } | undefined)?.full_name ?? '');
      });
  }, [user?.id]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateFamily = async () => {
    if (!groupName.trim()) return;
    setRunning(true);
    const result = await createFamily(groupName.trim());
    if (result.error) showToast(result.error.message ?? 'Could not create family.', 'error');
    else { showToast('Family created!'); setGroupName(''); }
    setRunning(false);
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) return;
    setRunning(true);
    const result = await joinFamily(joinCode.trim().toUpperCase());
    if (result.error) showToast(result.error.message ?? 'Could not join family.', 'error');
    else { showToast('Joined family!'); setJoinCode(''); }
    setRunning(false);
  };

  const handleGenerateCode = async () => {
    setRunning(true);
    const result = await generateInviteCode();
    if (result.error) showToast('Could not regenerate code.', 'error');
    else showToast('Code regenerated!');
    setRunning(false);
  };

  const handleCopyCode = async () => {
    if (!family?.invite_code) return;
    await navigator.clipboard.writeText(family.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSendInviteEmail = async () => {
    if (!inviteEmail.trim() || !family?.invite_code) return;
    setInviteSending(true);
    // Build a mailto link as a reliable cross-platform fallback.
    // A proper edge-function email can be wired up later.
    const subject = encodeURIComponent(`Join my family on Doable`);
    const body = encodeURIComponent(
      `Hey! I'd like you to join my family on Doable.\n\nUse invite code: ${family.invite_code}\n\nDownload the app and enter this code on the Family screen.`
    );
    window.open(`mailto:${inviteEmail.trim()}?subject=${subject}&body=${body}`);
    showToast(`Invite opened for ${inviteEmail.trim()}`);
    setInviteEmail('');
    setInviteSending(false);
  };

  const handleSaveMemberName = async (memberId: string) => {
    const result = await updateFamilyMember(memberId, { display_name: editMemberName.trim() || null });
    if (result.error) showToast('Could not save name.', 'error');
    else { showToast('Name saved!'); setEditingMemberId(null); setFullName(editMemberName.trim()); }
  };

  const handleAddKid = async () => {
    if (!kidName.trim()) return;
    setRunning(true);
    const result = await addKidProfile(kidName.trim(), kidColor);
    if (result.error) showToast(result.error.message ?? 'Could not add kid.', 'error');
    else {
      showToast(`${kidName} added!`);
      setKidName('');
      setKidColor('lavender');
      setShowAddKid(false);
    }
    setRunning(false);
  };

  const handleUpdateKid = async () => {
    if (!editingKidId || !editKidName.trim()) return;
    setRunning(true);
    const result = await updateKidProfile(editingKidId, { name: editKidName, color: editKidColor });
    if (result.error) showToast('Could not update kid.', 'error');
    else { showToast('Updated!'); setEditingKidId(null); }
    setRunning(false);
  };

  const handleRemoveKid = async (kidId: string, name: string) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    setRunning(true);
    const result = await removeKidProfile(kidId);
    if (result.error) showToast('Could not remove kid.', 'error');
    else showToast(`${name} removed.`);
    setRunning(false);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setProfileSaving(true);
    const { error: saveErr } = await supabase
      .from('user_profiles')
      .upsert({ id: user.id, full_name: fullName.trim() });
    if (saveErr) { showToast('Could not save profile.', 'error'); setProfileSaving(false); return; }

    // Keep family display name in sync so partner sees the correct name
    const myMember = familyMembers.find((m) => m.user_id === user.id);
    if (myMember) {
      await updateFamilyMember(myMember.id, { display_name: fullName.trim() || null });
    }

    showToast('Profile saved!');
    setProfileSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lavender" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className={`px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white ${
            toast.type === 'error' ? 'bg-rose' : 'bg-green'
          }`}>
            {toast.msg}
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-ink">
          {family ? family.name : 'Family'}
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-bg-deep rounded-xl p-1">
        {(['family', 'account'] as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === key ? 'bg-white text-lavender shadow-sm' : 'text-ink-3'
            }`}
          >
            {key === 'family' ? '👨‍👩‍👧‍👦 Family' : '⚙️ Account'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-soft border border-red/20 rounded-xl text-sm text-red">{error}</div>
      )}

      {/* ── FAMILY TAB ── */}
      {tab === 'family' && (
        <div className="space-y-4">
          {!family ? (
            <>
              <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-3">
                <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider">Create a Family</h2>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleCreateFamily()}
                  placeholder="Family name"
                  className="w-full px-3 py-2.5 border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-lavender bg-bg-deep"
                />
                <button
                  onClick={() => void handleCreateFamily()}
                  disabled={running || !groupName.trim()}
                  className="w-full py-3 bg-lavender text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {running ? 'Creating…' : 'Create Family'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-line" />
                <span className="text-xs text-ink-4 font-medium">or join existing</span>
                <div className="flex-1 h-px bg-line" />
              </div>

              <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-3">
                <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider">Join a Family</h2>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && void handleJoinFamily()}
                  placeholder="Invite code"
                  className="w-full px-3 py-2.5 border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-lavender bg-bg-deep tracking-widest font-mono"
                />
                <button
                  onClick={() => void handleJoinFamily()}
                  disabled={running || !joinCode.trim()}
                  className="w-full py-3 bg-sky text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {running ? 'Joining…' : 'Join Family'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Invite code */}
              <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider">Invite Code</h2>
                  {isOwner && (
                    <button
                      onClick={() => void handleGenerateCode()}
                      disabled={running}
                      className="text-xs font-semibold text-lavender bg-plum-soft px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity disabled:opacity-40"
                    >
                      Regenerate
                    </button>
                  )}
                </div>
                <button
                  onClick={() => void handleCopyCode()}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-bg-deep border-2 border-dashed border-line rounded-xl hover:border-lavender/50 transition-colors group"
                >
                  <span className="text-lg font-extrabold tracking-[0.3em] text-ink font-mono">
                    {family.invite_code ?? '—'}
                  </span>
                  <span className="text-xs text-ink-4 group-hover:text-lavender transition-colors">
                    {codeCopied ? '✓ Copied!' : '📋 Copy'}
                  </span>
                </button>

                {/* Send invite by email */}
                {isOwner && (
                  <div className="pt-1 space-y-2">
                    <p className="text-xs text-ink-4">Or send invite by email</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && void handleSendInviteEmail()}
                        placeholder="partner@email.com"
                        className="flex-1 px-3 py-2.5 border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-lavender bg-bg-deep"
                      />
                      <button
                        onClick={() => void handleSendInviteEmail()}
                        disabled={inviteSending || !inviteEmail.trim()}
                        className="px-4 py-2 bg-lavender text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4">
                <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-3">Members</h2>
                <div className="space-y-2">
                  {familyMembers.map((member) => {
                    const isMe = member.user_id === user?.id;
                    const canEdit = isMe;
                    const label = member.display_name ?? (isMe ? 'You' : member.role === 'owner' ? 'Owner' : 'Partner');
                    return (
                      <div key={member.id} className="flex flex-col gap-1 py-2 px-3 bg-bg-deep rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-plum-soft rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-base">{member.role === 'owner' ? '👑' : '👤'}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-ink-2">{label}</p>
                            <p className="text-xs text-ink-4">
                              {member.role === 'owner' ? 'Owner' : 'Partner'} · Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                            {isMe && !member.display_name && (
                              <p className="text-xs text-amber mt-0.5">Set your name so your partner sees you correctly</p>
                            )}
                          </div>
                          {canEdit && editingMemberId !== member.id && (
                            <button
                              onClick={() => { setEditingMemberId(member.id); setEditMemberName(member.display_name ?? ''); }}
                              className="text-xs text-lavender font-semibold px-2 py-1 rounded-lg hover:bg-plum-soft transition-colors"
                            >
                              {member.display_name ? 'Rename' : 'Set name'}
                            </button>
                          )}
                        </div>
                        {editingMemberId === member.id && (
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              value={editMemberName}
                              onChange={(e) => setEditMemberName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') void handleSaveMemberName(member.id); if (e.key === 'Escape') setEditingMemberId(null); }}
                              placeholder="Your name (seen by your partner)"
                              className="flex-1 px-3 py-2 border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-lavender bg-white"
                              autoFocus
                            />
                            <button onClick={() => void handleSaveMemberName(member.id)} className="px-3 py-2 bg-lavender text-white rounded-xl text-sm font-bold hover:opacity-90">Save</button>
                            <button onClick={() => setEditingMemberId(null)} className="px-3 py-2 border border-line rounded-xl text-sm text-ink-3 hover:bg-bg-deep">✕</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kids */}
              <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider">Kids</h2>
                  {isOwner && (
                    <button
                      onClick={() => { setShowAddKid(!showAddKid); setKidName(''); setKidColor('lavender'); }}
                      className="text-xs font-semibold text-lavender bg-plum-soft px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity"
                    >
                      {showAddKid ? 'Cancel' : '+ Add'}
                    </button>
                  )}
                </div>

                {showAddKid && (
                  <div className="mb-3 p-3 bg-bg-deep rounded-xl space-y-3">
                    <input
                      type="text"
                      value={kidName}
                      onChange={(e) => setKidName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void handleAddKid()}
                      placeholder="Kid's name"
                      className="w-full px-3 py-2 border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-lavender bg-white"
                    />
                    <div className="flex gap-2">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setKidColor(c.name)}
                          className={`flex-1 h-7 rounded-lg border-2 transition-all ${
                            kidColor === c.name ? 'border-ink scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => void handleAddKid()}
                      disabled={running || !kidName.trim()}
                      className="w-full py-2 bg-lavender text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-40 text-sm"
                    >
                      {running ? 'Adding…' : 'Add Kid'}
                    </button>
                  </div>
                )}

                {kidProfiles.length === 0 ? (
                  <p className="text-sm text-ink-4 text-center py-4">No kids added yet</p>
                ) : (
                  <div className="space-y-2">
                    {kidProfiles.map((kid) => {
                      const c = colorFor(kid.color);
                      if (editingKidId === kid.id) {
                        return (
                          <div key={kid.id} className="p-3 rounded-xl space-y-2" style={{ backgroundColor: c.bg, border: `1.5px solid ${c.ring}` }}>
                            <input
                              type="text"
                              value={editKidName}
                              onChange={(e) => setEditKidName(e.target.value)}
                              className="w-full px-3 py-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lavender bg-white"
                            />
                            <div className="flex gap-2">
                              {COLOR_OPTIONS.map((opt) => (
                                <button
                                  key={opt.name}
                                  onClick={() => setEditKidColor(opt.name)}
                                  className={`flex-1 h-6 rounded border-2 transition-all ${editKidColor === opt.name ? 'border-ink' : 'border-transparent'}`}
                                  style={{ backgroundColor: opt.hex }}
                                />
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => void handleUpdateKid()} disabled={running} className="flex-1 py-1.5 bg-lavender text-white text-xs font-bold rounded-lg disabled:opacity-40">
                                Save
                              </button>
                              <button onClick={() => setEditingKidId(null)} className="flex-1 py-1.5 bg-bg-deep text-ink-2 text-xs font-bold rounded-lg">
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={kid.id}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                          style={{ backgroundColor: c.bg, border: `1.5px solid ${c.ring}` }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: c.hex }}
                          >
                            {kid.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="flex-1 font-semibold text-ink text-sm">{kid.name}</span>
                          <button
                            onClick={() => { setEditingKidId(kid.id); setEditKidName(kid.name); setEditKidColor(kid.color); }}
                            className="text-xs text-ink-4 hover:text-lavender px-2 py-1"
                          >
                            Edit
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => void handleRemoveKid(kid.id, kid.name)}
                              className="text-xs text-rose/60 hover:text-rose px-2 py-1"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ACCOUNT TAB ── */}
      {tab === 'account' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-lavender rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-white">
                  {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-ink truncate">{fullName || 'Your Account'}</p>
                <p className="text-sm text-ink-4 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="h-px bg-line-soft" />

            <div>
              <label className="block text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2.5 border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-lavender bg-bg-deep"
              />
            </div>

            <button
              onClick={() => void handleSaveProfile()}
              disabled={profileSaving}
              className="w-full py-2.5 bg-lavender text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity text-sm"
            >
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4">
            <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-1">App Permissions</h2>
            <p className="text-xs text-ink-4 mb-2">Grant permissions upfront so features work when you need them.</p>
            {(Object.keys(PERM_META) as Array<keyof typeof PERM_META>).map((type) => (
              <PermissionRow
                key={type}
                type={type}
                status={permissions[type as keyof typeof permissions]}
                requesting={requesting === type}
                onRequest={() => void requestPermission(type as 'notifications' | 'microphone' | 'camera')}
              />
            ))}
            {(permissions.notifications === 'denied' || permissions.microphone === 'denied' || permissions.camera === 'denied') && (
              <p className="text-xs text-ink-4 mt-2 leading-relaxed">
                ⚙️ To unblock, go to browser/device settings → find this site → allow the permission, then refresh.
              </p>
            )}
          </div>

          {/* Data Reset */}
          <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4">
            <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-1">Data Reset</h2>
            <p className="text-xs text-ink-4 mb-4">You have full control over your data. These actions are permanent and cannot be undone.</p>

            {(
              [
                { type: 'tasks'   as const, icon: '📋', label: 'Reset Tasks',         desc: 'Deletes all tasks for your family' },
                { type: 'habits'  as const, icon: '🎯', label: 'Reset Habit Progress', desc: 'Clears all completions, streaks stay visible until next sync' },
                { type: 'rewards' as const, icon: '🎁', label: 'Reset Rewards',        desc: 'Deletes all rewards, points and redemption history' },
              ]
            ).map(({ type, icon, label, desc }) => (
              <div key={type} className="py-3 border-b border-line-soft last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">{label}</p>
                    <p className="text-xs text-ink-4">{desc}</p>
                  </div>
                  {resetDone === type ? (
                    <span className="text-xs font-semibold text-mint">Done ✓</span>
                  ) : resetConfirm === type ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setResetConfirm(null)}
                        className="px-3 py-1.5 text-xs font-bold rounded-full border border-line text-ink-3"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void handleReset(type)}
                        disabled={resetting}
                        className="px-3 py-1.5 text-xs font-bold rounded-full bg-rose text-white disabled:opacity-50"
                      >
                        {resetting ? '…' : 'Confirm'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResetConfirm(type)}
                      className="px-3 py-1.5 text-xs font-bold rounded-full border-2 border-rose/40 text-rose hover:bg-rose/10 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-line-soft shadow-sm p-4">
            <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-3">Account</h2>
            <button
              onClick={() => void signOut()}
              className="w-full py-2.5 border-2 border-line text-ink-2 font-bold rounded-xl hover:border-rose/40 hover:text-rose transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>

          <div className="text-center py-2">
            <p className="text-xs text-ink-4">Doable · v1.0.0</p>
            <p className="text-xs text-ink-4 mt-1 opacity-60">Making family life more organized</p>
          </div>
        </div>
      )}
    </div>
  );
}
