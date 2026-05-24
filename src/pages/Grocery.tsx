import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroceryContext } from '../context/GroceryContext';
import { useFamilyContext } from '../context/FamilyContext';
import { useAuthContext } from '../context/AuthContext';
import GroceryItemCard from '../components/grocery/GroceryItemCard';
import { MAX_GROCERY_ITEMS } from '../utils/groceryModels';

export default function Grocery() {
  const { items, loading, syncing, error, addItem, togglePurchased, renameItem, deleteItem, clearPurchased } =
    useGroceryContext();
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

  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [showPurchased, setShowPurchased] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const unpurchased = items.filter((i) => !i.is_purchased);
  const purchased = items.filter((i) => i.is_purchased);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    setAdding(true);
    setAddError('');
    const result = await addItem(trimmed);
    if (result.error) {
      setAddError(result.error);
    } else {
      setNewName('');
    }
    setAdding(false);
    inputRef.current?.focus();
  };

  const handleClearPurchased = async () => {
    if (purchased.length === 0) return;
    await clearPurchased();
  };

  if (!loading && !family) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-extrabold text-ink mb-2">No family yet</h2>
        <p className="text-sm text-ink-3 mb-6">Create or join a family to use the grocery list.</p>
        <button
          onClick={() => navigate('/family')}
          className="px-6 py-3 bg-lavender text-white font-bold rounded-2xl hover:opacity-90 transition-all active:scale-95"
        >
          Go to Family tab
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Grocery List</h1>
        <div className="flex items-center gap-2">
          {syncing && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse inline-block" />
              Syncing…
            </span>
          )}
          <span className="text-xs text-gray-400">
            {unpurchased.length}/{MAX_GROCERY_ITEMS}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Add item input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
          placeholder="Add an item…"
          maxLength={100}
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mint shadow-sm"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={adding || !newName.trim()}
          className="px-5 py-3 bg-mint text-white font-bold rounded-xl disabled:opacity-40 transition-opacity hover:opacity-90 shadow-sm flex-shrink-0"
        >
          {adding ? '…' : 'Add'}
        </button>
      </div>

      {addError && (
        <p className="text-xs text-rose font-medium -mt-2 px-1">{addError}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint" />
        </div>
      ) : (
        <>
          {/* ── UNPURCHASED ── */}
          {unpurchased.length === 0 && purchased.length === 0 ? (
            <div className="flex flex-col items-center text-center py-16 px-6">
              <div className="text-5xl mb-4">🛒</div>
              <p className="font-bold text-ink mb-1">Your list is empty</p>
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

              {/* ── PURCHASED SECTION ── */}
              {purchased.length > 0 && (
                <div className="space-y-2">
                  {/* Section header */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setShowPurchased((v) => !v)}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-500"
                    >
                      <span className={`transition-transform ${showPurchased ? 'rotate-90' : ''}`}>▶</span>
                      In basket ({purchased.length})
                    </button>
                    <button
                      onClick={() => void handleClearPurchased()}
                      className="text-xs font-bold text-rose hover:underline transition-opacity"
                    >
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
