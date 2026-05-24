import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroceryContext } from '../context/GroceryContext';
import { useFamilyContext } from '../context/FamilyContext';
import { useAuthContext } from '../context/AuthContext';
import GroceryItemCard from '../components/grocery/GroceryItemCard';
import { MAX_GROCERY_ITEMS, MAX_GROCERY_LISTS } from '../utils/groceryModels';

export default function Grocery() {
  const {
    lists, activeListId, setActiveListId,
    items, loading, syncing, error,
    createList, renameList, deleteList,
    addItem, togglePurchased, renameItem, deleteItem, clearPurchased,
  } = useGroceryContext();
  const { family, familyMembers } = useFamilyContext();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const nameFor = useMemo(() => {
    const first = (s: string) => s.split(' ')[0];
    const map: Record<string, string> = {};
    familyMembers.forEach((m) => {
      map[m.user_id] = first(m.display_name ?? (m.role === 'owner' ? 'Owner' : 'Partner'));
    });
    return (userId: string | null): string | undefined => {
      if (!userId) return undefined;
      if (userId === user?.id) return 'You';
      return map[userId];
    };
  }, [familyMembers, user?.id]);

  // Item input
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [showPurchased, setShowPurchased] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // New list creation
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const newListInputRef = useRef<HTMLInputElement>(null);

  // List options menu (rename / delete)
  const [menuListId, setMenuListId] = useState<string | null>(null);
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const unpurchased = items.filter((i) => !i.is_purchased);
  const purchased = items.filter((i) => i.is_purchased);
  const activeList = lists.find((l) => l.id === activeListId);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    setAdding(true);
    setAddError('');
    const result = await addItem(trimmed);
    if (result.error) setAddError(result.error);
    else setNewName('');
    setAdding(false);
    inputRef.current?.focus();
  };

  const handleCreateList = async () => {
    const trimmed = newListName.trim();
    if (!trimmed) { newListInputRef.current?.focus(); return; }
    setCreatingList(true);
    const result = await createList(trimmed);
    if (!result.error) { setNewListName(''); setShowNewList(false); }
    setCreatingList(false);
  };

  const handleRenameList = async (id: string) => {
    const trimmed = renameDraft.trim();
    if (!trimmed) return;
    await renameList(id, trimmed);
    setRenamingListId(null);
    setMenuListId(null);
  };

  const handleDeleteList = async (id: string) => {
    if (!window.confirm('Delete this list and all its items?')) return;
    await deleteList(id);
    setMenuListId(null);
  };

  if (!loading && !family) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-extrabold text-ink mb-2">No family yet</h2>
        <p className="text-sm text-ink-3 mb-6">Create or join a family to use the grocery list.</p>
        <button onClick={() => navigate('/family')} className="px-6 py-3 bg-lavender text-white font-bold rounded-2xl hover:opacity-90 transition-all active:scale-95">
          Go to Family tab
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">Grocery</h1>
        <div className="flex items-center gap-2">
          {syncing && (
            <span className="text-xs text-ink-4 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse inline-block" />
              Syncing…
            </span>
          )}
          <span className="text-xs text-ink-4">{unpurchased.length}/{MAX_GROCERY_ITEMS}</span>
        </div>
      </div>

      {/* ── List tabs ── */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {lists.map((list) => (
          <div key={list.id} className="relative flex-shrink-0">
            {renamingListId === list.id ? (
              /* Inline rename input */
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleRenameList(list.id);
                    if (e.key === 'Escape') { setRenamingListId(null); setMenuListId(null); }
                  }}
                  className="w-28 px-2 py-1.5 text-sm font-semibold border-2 border-lavender rounded-xl outline-none bg-white text-ink"
                />
                <button onClick={() => void handleRenameList(list.id)} className="text-xs font-bold text-white bg-lavender px-2 py-1.5 rounded-xl">✓</button>
                <button onClick={() => { setRenamingListId(null); setMenuListId(null); }} className="text-xs text-ink-3">✕</button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (activeListId === list.id) {
                    setMenuListId(menuListId === list.id ? null : list.id);
                  } else {
                    setActiveListId(list.id);
                    setMenuListId(null);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  activeListId === list.id
                    ? 'bg-lavender text-white shadow-sm'
                    : 'bg-bg-deep text-ink-3 hover:text-ink'
                }`}
              >
                {list.name}
                {activeListId === list.id && lists.length > 1 && (
                  <span className="ml-1.5 opacity-70 text-xs">▾</span>
                )}
              </button>
            )}

            {/* Options dropdown for active tab */}
            {menuListId === list.id && renamingListId !== list.id && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-xl border border-line z-30 overflow-hidden min-w-[140px]">
                <button
                  onClick={() => { setRenameDraft(list.name); setRenamingListId(list.id); }}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-ink hover:bg-bg-deep flex items-center gap-2"
                >
                  ✏️ Rename
                </button>
                {lists.length > 1 && (
                  <button
                    onClick={() => void handleDeleteList(list.id)}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-rose hover:bg-bg-deep flex items-center gap-2"
                  >
                    🗑 Delete list
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add new list button */}
        {lists.length < MAX_GROCERY_LISTS && !showNewList && (
          <button
            onClick={() => { setShowNewList(true); setMenuListId(null); setTimeout(() => newListInputRef.current?.focus(), 50); }}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-bg-deep text-ink-3 hover:text-ink text-lg font-bold flex items-center justify-center transition-colors"
            title="New list"
          >
            +
          </button>
        )}

        {/* New list inline input */}
        {showNewList && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              ref={newListInputRef}
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreateList();
                if (e.key === 'Escape') { setShowNewList(false); setNewListName(''); }
              }}
              placeholder="List name…"
              maxLength={30}
              className="w-28 px-3 py-1.5 text-sm font-semibold border-2 border-lavender rounded-xl outline-none bg-white text-ink placeholder-ink-4"
            />
            <button
              onClick={() => void handleCreateList()}
              disabled={creatingList || !newListName.trim()}
              className="text-xs font-bold text-white bg-lavender px-3 py-1.5 rounded-xl disabled:opacity-40"
            >
              {creatingList ? '…' : 'Add'}
            </button>
            <button onClick={() => { setShowNewList(false); setNewListName(''); }} className="text-xs text-ink-3">✕</button>
          </div>
        )}
      </div>

      {/* Dismiss menu on outside tap */}
      {menuListId && (
        <div className="fixed inset-0 z-20" onClick={() => setMenuListId(null)} />
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {/* Add item input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
          placeholder={`Add to ${activeList?.name ?? 'list'}…`}
          maxLength={100}
          className="flex-1 px-4 py-3 bg-white border border-line rounded-xl text-sm text-ink placeholder-ink-4 focus:outline-none focus:ring-2 focus:ring-mint shadow-sm"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={adding || !newName.trim()}
          className="px-5 py-3 bg-mint text-white font-bold rounded-xl disabled:opacity-40 transition-opacity hover:opacity-90 shadow-sm flex-shrink-0"
        >
          {adding ? '…' : 'Add'}
        </button>
      </div>

      {addError && <p className="text-xs text-rose font-medium -mt-2 px-1">{addError}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint" />
        </div>
      ) : (
        <>
          {unpurchased.length === 0 && purchased.length === 0 ? (
            <div className="flex flex-col items-center text-center py-16 px-6">
              <div className="text-5xl mb-4">🛒</div>
              <p className="font-bold text-ink mb-1">{activeList?.name ?? 'List'} is empty</p>
              <p className="text-sm text-ink-4">Type an item above and tap Add — it syncs instantly with your family.</p>
            </div>
          ) : (
            <>
              {unpurchased.length > 0 && (
                <div className="space-y-2">
                  {unpurchased.map((item) => (
                    <GroceryItemCard
                      key={item.id}
                      item={item}
                      addedByName={nameFor(item.added_by)}
                      onToggle={(id) => void togglePurchased(id)}
                      onRename={(id, name) => void renameItem(id, name)}
                      onDelete={(id) => void deleteItem(id)}
                    />
                  ))}
                </div>
              )}

              {purchased.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setShowPurchased((v) => !v)}
                      className="flex items-center gap-2 text-sm font-semibold text-ink-3"
                    >
                      <span className={`transition-transform ${showPurchased ? 'rotate-90' : ''}`}>▶</span>
                      In basket ({purchased.length})
                    </button>
                    <button onClick={() => void clearPurchased()} className="text-xs font-bold text-rose hover:underline">
                      Clear all
                    </button>
                  </div>

                  {showPurchased && (
                    <div className="space-y-2">
                      {purchased.map((item) => (
                        <GroceryItemCard
                          key={item.id}
                          item={item}
                          onToggle={(id) => void togglePurchased(id)}
                          onRename={(id, name) => void renameItem(id, name)}
                          onDelete={(id) => void deleteItem(id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
