import { useState, useRef, useEffect } from 'react';
import type { GroceryItem } from '../../utils/groceryModels';

interface Props {
  item: GroceryItem;
  onToggle: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function GroceryItemCard({ item, onToggle, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.name) {
      onRename(item.id, trimmed);
    } else {
      setDraft(item.name); // revert if empty or unchanged
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') { setDraft(item.name); setEditing(false); }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl border transition-all ${
        item.is_purchased ? 'border-gray-100 opacity-60' : 'border-gray-100 shadow-sm'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          item.is_purchased
            ? 'bg-mint border-mint'
            : 'border-gray-300 hover:border-mint'
        }`}
        aria-label={item.is_purchased ? 'Mark as not purchased' : 'Mark as purchased'}
      >
        {item.is_purchased && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Name — tap to edit */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            maxLength={100}
            className="w-full text-sm font-medium text-gray-900 bg-transparent border-b-2 border-lavender outline-none py-0.5"
          />
        ) : (
          <span
            onClick={() => { if (!item.is_purchased) { setDraft(item.name); setEditing(true); } }}
            className={`text-sm font-medium block truncate ${
              item.is_purchased
                ? 'line-through text-gray-400'
                : 'text-gray-800 cursor-text'
            }`}
          >
            {item.name}
          </span>
        )}
      </div>

      {/* Edit button (only when not purchased) */}
      {!item.is_purchased && !editing && (
        <button
          onClick={() => { setDraft(item.name); setEditing(true); }}
          className="flex-shrink-0 text-gray-300 hover:text-lavender transition-colors p-1"
          aria-label="Edit item"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.293-6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L12 16H9v-3z" />
          </svg>
        </button>
      )}

      {/* Delete button */}
      <button
        onClick={() => onDelete(item.id)}
        className="flex-shrink-0 text-gray-300 hover:text-rose transition-colors p-1"
        aria-label="Delete item"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
