import { useEffect, useState } from 'react';
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

const colorHex = (name: FamilyColor) => COLORS.find((c) => c.name === name)?.hex ?? '#ccc';

const TABS = ['Family Info', 'Kids', 'Permissions', 'Danger Zone'];

interface Permissions {
  partnerViewKidTasks: boolean;
  partnerModifyKidRewards: boolean;
  partnerCanInvite: boolean;
}

const DEFAULT_PERMS: Permissions = {
  partnerViewKidTasks: true,
  partnerModifyKidRewards: false,
  partnerCanInvite: false,
};

function Toast({ message, type = 'success', onDismiss }: { message: string; type?: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  const bg = type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-50 border-green-300 text-green-700';
  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border text-sm font-medium shadow-lg ${bg}`}>
      {message}
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 text-sm">{body}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 text-white rounded-lg font-semibold ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FamilySettings() {
  const navigate = useNavigate();
  const { family, familyMembers, kidProfiles, isOwner, removeFamilyMember, removeKidProfile, updateKidProfile } = useFamilyContext();

  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<{ title: string; body: string; action: string } | null>(null);
  const [editingFamilyName, setEditingFamilyName] = useState(family?.name || '');
  const [editingKid, setEditingKid] = useState<string | null>(null);
  const [editKidName, setEditKidName] = useState('');
  const [editKidColor, setEditKidColor] = useState<FamilyColor>('lavender');
  const [perms, setPerms] = useState<Permissions>(DEFAULT_PERMS);

  useEffect(() => {
    if (family) {
      setEditingFamilyName(family.name);
      const stored = localStorage.getItem(`doable:family:${family.id}:permissions`);
      if (stored) {
        setPerms(JSON.parse(stored));
      }
    }
  }, [family]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleUpdateFamilyName = async () => {
    if (!editingFamilyName.trim()) {
      showToast('Family name cannot be empty', 'error');
      return;
    }
    // TODO: Implement family name update
    showToast('Family name updated');
  };

  const handleRemoveMember = async (memberId: string) => {
    const result = await removeFamilyMember(memberId);
    if (result.error) {
      showToast('Failed to remove member', 'error');
    } else {
      showToast('Member removed');
    }
    setModal(null);
  };

  const handleEditKid = (kid: any) => {
    setEditingKid(kid.id);
    setEditKidName(kid.name);
    setEditKidColor(kid.color);
  };

  const handleUpdateKid = async () => {
    if (!editingKid) return;
    const result = await updateKidProfile(editingKid, { name: editKidName, color: editKidColor });
    if (result.error) {
      showToast('Failed to update kid', 'error');
    } else {
      showToast('Kid updated');
      setEditingKid(null);
    }
  };

  const handleRemoveKid = async (kidId: string) => {
    const result = await removeKidProfile(kidId);
    if (result.error) {
      showToast('Failed to remove kid', 'error');
    } else {
      showToast('Kid removed');
    }
    setModal(null);
  };

  if (!family) {
    return (
      <div className="p-6 text-center text-gray-600">
        <p>No family found. Please create or join a family first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="bg-white rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 flex">
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`flex-1 py-3 text-sm font-medium transition ${
                tab === i ? 'border-b-2 border-violet-600 text-violet-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Tab 0: Family Info */}
          {tab === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Family Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingFamilyName}
                    onChange={(e) => setEditingFamilyName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {isOwner && <button onClick={handleUpdateFamilyName} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Save
                  </button>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invite Code</label>
                <input type="text" value={family.invite_code || ''} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Members</label>
                <div className="space-y-2">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{member.role === 'owner' ? '👤 Owner' : '👥 Partner'}</span>
                      {isOwner && member.role !== 'owner' && (
                        <button
                          onClick={() => setModal({ title: 'Remove Member', body: 'Are you sure?', action: 'remove-member-' + member.id })}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Kids */}
          {tab === 1 && (
            <div className="space-y-4">
              {kidProfiles.map((kid) => (
                <div key={kid.id} className="p-4 rounded-lg border-2" style={{ borderColor: colorHex(kid.color) }}>
                  {editingKid === kid.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editKidName}
                        onChange={(e) => setEditKidName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                      <div className="grid grid-cols-6 gap-2">
                        {COLORS.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => setEditKidColor(c.name)}
                            className={`h-8 rounded border-2 ${editKidColor === c.name ? 'border-gray-900' : 'border-gray-300'}`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleUpdateKid} className="flex-1 py-2 bg-blue-600 text-white rounded">
                          Save
                        </button>
                        <button onClick={() => setEditingKid(null)} className="flex-1 py-2 bg-gray-300 rounded">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{kid.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditKid(kid)} className="text-blue-600 text-sm">
                          Edit
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => setModal({ title: 'Remove Kid', body: `Remove ${kid.name}?`, action: 'remove-kid-' + kid.id })}
                            className="text-red-600 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Permissions */}
          {tab === 2 && isOwner && (
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={perms.partnerViewKidTasks}
                  onChange={(e) => {
                    const newPerms = { ...perms, partnerViewKidTasks: e.target.checked };
                    setPerms(newPerms);
                    localStorage.setItem(`doable:family:${family.id}:permissions`, JSON.stringify(newPerms));
                  }}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Partner can view kid tasks</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={perms.partnerModifyKidRewards}
                  onChange={(e) => {
                    const newPerms = { ...perms, partnerModifyKidRewards: e.target.checked };
                    setPerms(newPerms);
                    localStorage.setItem(`doable:family:${family.id}:permissions`, JSON.stringify(newPerms));
                  }}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Partner can modify kid rewards</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={perms.partnerCanInvite}
                  onChange={(e) => {
                    const newPerms = { ...perms, partnerCanInvite: e.target.checked };
                    setPerms(newPerms);
                    localStorage.setItem(`doable:family:${family.id}:permissions`, JSON.stringify(newPerms));
                  }}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Partner can invite people</span>
              </label>
            </div>
          )}

          {/* Tab 3: Danger Zone */}
          {tab === 3 && (
            <div className="space-y-4 border-t pt-4 border-red-200">
              {!isOwner && (
                <button
                  onClick={() => setModal({ title: 'Leave Family', body: 'Are you sure you want to leave this family?', action: 'leave-family' })}
                  className="w-full py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold"
                >
                  Leave Family
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => setModal({ title: 'Delete Family', body: 'This action cannot be undone.', action: 'delete-family' })}
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  Delete Family
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <ConfirmModal
          open={true}
          title={modal.title}
          body={modal.body}
          danger={modal.action.startsWith('delete') || modal.action === 'leave-family'}
          onConfirm={() => {
            if (modal.action.startsWith('remove-member-')) {
              handleRemoveMember(modal.action.replace('remove-member-', ''));
            } else if (modal.action.startsWith('remove-kid-')) {
              handleRemoveKid(modal.action.replace('remove-kid-', ''));
            } else if (modal.action === 'leave-family') {
              navigate('/home');
            } else if (modal.action === 'delete-family') {
              navigate('/home');
            }
          }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
