import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from './AuthContext';
import { useFamilyContext } from './FamilyContext';
import type { GroceryItem, GroceryList } from '../utils/groceryModels';
import { MAX_GROCERY_ITEMS, MAX_GROCERY_LISTS } from '../utils/groceryModels';

type GroceryContextValue = {
  lists: GroceryList[];
  activeListId: string | null;
  setActiveListId: (id: string) => void;
  items: GroceryItem[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  createList: (name: string) => Promise<{ data?: GroceryList; error?: string }>;
  renameList: (id: string, name: string) => Promise<{ error?: string }>;
  deleteList: (id: string) => Promise<{ error?: string }>;
  addItem: (name: string) => Promise<{ error?: string }>;
  togglePurchased: (id: string) => Promise<{ error?: string }>;
  renameItem: (id: string, name: string) => Promise<{ error?: string }>;
  deleteItem: (id: string) => Promise<{ error?: string }>;
  clearPurchased: () => Promise<{ error?: string }>;
};

const GroceryContext = createContext<GroceryContextValue | undefined>(undefined);

export const useGroceryContext = () => {
  const ctx = useContext(GroceryContext);
  if (!ctx) throw new Error('useGroceryContext must be used within GroceryProvider');
  return ctx;
};

export const GroceryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const { family } = useFamilyContext();

  const [lists, setLists] = useState<GroceryList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Items scoped to the active list
  const items = allItems.filter((i) => i.list_id === activeListId);

  const fetchLists = useCallback(async (): Promise<GroceryList[]> => {
    if (!family?.id) return [];

    const { data, error: err } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: true });

    if (err) { setError(err.message); return []; }
    return (data ?? []) as GroceryList[];
  }, [family?.id]);

  const fetchItems = useCallback(async () => {
    if (!family?.id) {
      setAllItems([]);
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: true });

    if (err) setError(err.message);
    setAllItems((data ?? []) as GroceryItem[]);
  }, [family?.id]);

  // Bootstrap: load lists (auto-create default if none), then load items
  const bootstrap = useCallback(async () => {
    if (!family?.id) {
      setLists([]);
      setAllItems([]);
      setActiveListId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let fetchedLists = await fetchLists();

    // Auto-create a default "Groceries" list for new families
    if (fetchedLists.length === 0) {
      const { data: newList, error: createErr } = await supabase
        .from('grocery_lists')
        .insert([{ family_id: family.id, name: 'Groceries', created_by: user?.id ?? null }])
        .select()
        .single();
      if (!createErr && newList) {
        fetchedLists = [newList as GroceryList];
      }
    }

    setLists(fetchedLists);
    setActiveListId((prev) => {
      if (prev && fetchedLists.some((l) => l.id === prev)) return prev;
      return fetchedLists[0]?.id ?? null;
    });

    await fetchItems();
    setLoading(false);
  }, [family?.id, user?.id, fetchLists, fetchItems]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Real-time subscription for items
  useEffect(() => {
    if (!family?.id) return;

    const pulse = () => { setSyncing(true); setTimeout(() => setSyncing(false), 600); };
    const filter = `family_id=eq.${family.id}`;

    const channel = supabase
      .channel(`grocery:${family.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'grocery_items', filter }, (payload) => {
        pulse();
        setAllItems((prev) => {
          if (prev.some((i) => i.id === (payload.new as GroceryItem).id)) return prev;
          return [...prev, payload.new as GroceryItem];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'grocery_items', filter }, (payload) => {
        pulse();
        setAllItems((prev) =>
          prev.map((i) => (i.id === (payload.new as GroceryItem).id ? (payload.new as GroceryItem) : i))
        );
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'grocery_items', filter }, (payload) => {
        pulse();
        const deleted = payload.old as { id?: string };
        setAllItems((prev) => prev.filter((i) => i.id !== deleted.id));
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [family?.id]);

  // ── List operations ──────────────────────────────────────────────────

  const createList = async (name: string): Promise<{ data?: GroceryList; error?: string }> => {
    if (!family?.id) return { error: 'No family found' };
    const trimmed = name.trim();
    if (!trimmed) return { error: 'List name cannot be empty' };
    if (lists.length >= MAX_GROCERY_LISTS) return { error: `Maximum ${MAX_GROCERY_LISTS} lists reached` };

    const { data, error: err } = await supabase
      .from('grocery_lists')
      .insert([{ family_id: family.id, name: trimmed, created_by: user?.id ?? null }])
      .select()
      .single();

    if (err) return { error: err.message };
    const newList = data as GroceryList;
    setLists((prev) => [...prev, newList]);
    setActiveListId(newList.id);
    return { data: newList };
  };

  const renameList = async (id: string, name: string): Promise<{ error?: string }> => {
    const trimmed = name.trim();
    if (!trimmed) return { error: 'Name cannot be empty' };

    const { error: err } = await supabase
      .from('grocery_lists')
      .update({ name: trimmed })
      .eq('id', id);

    if (err) return { error: err.message };
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name: trimmed } : l)));
    return {};
  };

  const deleteList = async (id: string): Promise<{ error?: string }> => {
    if (lists.length <= 1) return { error: 'Cannot delete the last list' };

    const { error: err } = await supabase
      .from('grocery_lists')
      .delete()
      .eq('id', id);

    if (err) return { error: err.message };

    const remaining = lists.filter((l) => l.id !== id);
    setLists(remaining);
    setAllItems((prev) => prev.filter((i) => i.list_id !== id));
    if (activeListId === id) setActiveListId(remaining[0]?.id ?? null);
    return {};
  };

  // ── Item operations ──────────────────────────────────────────────────

  const addItem = async (name: string): Promise<{ error?: string }> => {
    if (!family?.id) return { error: 'No family found' };
    if (!activeListId) return { error: 'No list selected' };
    const trimmed = name.trim();
    if (!trimmed) return { error: 'Item name cannot be empty' };
    if (items.length >= MAX_GROCERY_ITEMS) return { error: `Maximum ${MAX_GROCERY_ITEMS} items reached` };

    const { error: err } = await supabase
      .from('grocery_items')
      .insert([{ family_id: family.id, list_id: activeListId, name: trimmed, added_by: user?.id ?? null }]);

    if (err) return { error: err.message };
    return {};
  };

  const togglePurchased = async (id: string): Promise<{ error?: string }> => {
    const item = allItems.find((i) => i.id === id);
    if (!item) return { error: 'Item not found' };

    setAllItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_purchased: !i.is_purchased } : i)));

    const { error: err } = await supabase
      .from('grocery_items')
      .update({ is_purchased: !item.is_purchased })
      .eq('id', id);

    if (err) {
      setAllItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_purchased: item.is_purchased } : i)));
      return { error: err.message };
    }
    return {};
  };

  const renameItem = async (id: string, name: string): Promise<{ error?: string }> => {
    const trimmed = name.trim();
    if (!trimmed) return { error: 'Name cannot be empty' };

    const { error: err } = await supabase.from('grocery_items').update({ name: trimmed }).eq('id', id);
    if (err) return { error: err.message };
    setAllItems((prev) => prev.map((i) => (i.id === id ? { ...i, name: trimmed } : i)));
    return {};
  };

  const deleteItem = async (id: string): Promise<{ error?: string }> => {
    setAllItems((prev) => prev.filter((i) => i.id !== id));
    const { error: err } = await supabase.from('grocery_items').delete().eq('id', id);
    if (err) { void fetchItems(); return { error: err.message }; }
    return {};
  };

  const clearPurchased = async (): Promise<{ error?: string }> => {
    if (!activeListId) return {};
    const purchasedIds = items.filter((i) => i.is_purchased).map((i) => i.id);
    if (purchasedIds.length === 0) return {};

    setAllItems((prev) => prev.filter((i) => !purchasedIds.includes(i.id)));

    const { error: err } = await supabase.from('grocery_items').delete().in('id', purchasedIds);
    if (err) { void fetchItems(); return { error: err.message }; }
    return {};
  };

  const value: GroceryContextValue = {
    lists,
    activeListId,
    setActiveListId,
    items,
    loading,
    syncing,
    error,
    createList,
    renameList,
    deleteList,
    addItem,
    togglePurchased,
    renameItem,
    deleteItem,
    clearPurchased,
  };

  return <GroceryContext.Provider value={value}>{children}</GroceryContext.Provider>;
};
