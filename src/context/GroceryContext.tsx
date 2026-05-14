import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../supabaseClient';
import { useFamilyContext } from './FamilyContext';
import type { GroceryItem } from '../utils/groceryModels';
import { MAX_GROCERY_ITEMS } from '../utils/groceryModels';

type GroceryContextValue = {
  items: GroceryItem[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
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
  const { family } = useFamilyContext();

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!family?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: true });

    if (err) setError(err.message);
    setItems((data ?? []) as GroceryItem[]);
    setLoading(false);
  }, [family?.id]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  // Real-time subscription — scoped to this family
  useEffect(() => {
    if (!family?.id) return;

    const pulse = () => { setSyncing(true); setTimeout(() => setSyncing(false), 600); };
    const filter = `family_id=eq.${family.id}`;

    const channel = supabase
      .channel(`grocery:${family.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'grocery_items', filter }, (payload) => {
        pulse();
        setItems((prev) => [...prev, payload.new as GroceryItem]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'grocery_items', filter }, (payload) => {
        pulse();
        setItems((prev) =>
          prev.map((item) => (item.id === (payload.new as GroceryItem).id ? (payload.new as GroceryItem) : item))
        );
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'grocery_items', filter }, (payload) => {
        pulse();
        const deleted = payload.old as { id?: string };
        setItems((prev) => prev.filter((item) => item.id !== deleted.id));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [family?.id]);

  const addItem = async (name: string): Promise<{ error?: string }> => {
    if (!family?.id) return { error: 'No family found' };
    const trimmed = name.trim();
    if (!trimmed) return { error: 'Item name cannot be empty' };
    if (items.length >= MAX_GROCERY_ITEMS)
      return { error: `Maximum ${MAX_GROCERY_ITEMS} items reached` };

    const { error: err } = await supabase
      .from('grocery_items')
      .insert([{ family_id: family.id, name: trimmed }]);

    if (err) return { error: err.message };
    return {};
  };

  const togglePurchased = async (id: string): Promise<{ error?: string }> => {
    const item = items.find((i) => i.id === id);
    if (!item) return { error: 'Item not found' };

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_purchased: !i.is_purchased } : i))
    );

    const { error: err } = await supabase
      .from('grocery_items')
      .update({ is_purchased: !item.is_purchased })
      .eq('id', id);

    if (err) {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_purchased: item.is_purchased } : i))
      );
      return { error: err.message };
    }
    return {};
  };

  const renameItem = async (id: string, name: string): Promise<{ error?: string }> => {
    const trimmed = name.trim();
    if (!trimmed) return { error: 'Name cannot be empty' };

    const { error: err } = await supabase
      .from('grocery_items')
      .update({ name: trimmed })
      .eq('id', id);

    if (err) return { error: err.message };
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name: trimmed } : i)));
    return {};
  };

  const deleteItem = async (id: string): Promise<{ error?: string }> => {
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== id));

    const { error: err } = await supabase.from('grocery_items').delete().eq('id', id);
    if (err) {
      void fetchItems(); // Restore on failure
      return { error: err.message };
    }
    return {};
  };

  const clearPurchased = async (): Promise<{ error?: string }> => {
    if (!family?.id) return { error: 'No family found' };
    const purchasedIds = items.filter((i) => i.is_purchased).map((i) => i.id);
    if (purchasedIds.length === 0) return {};

    // Optimistic update
    setItems((prev) => prev.filter((i) => !i.is_purchased));

    const { error: err } = await supabase
      .from('grocery_items')
      .delete()
      .in('id', purchasedIds);

    if (err) {
      void fetchItems();
      return { error: err.message };
    }
    return {};
  };

  const value: GroceryContextValue = {
    items,
    loading,
    syncing,
    error,
    addItem,
    togglePurchased,
    renameItem,
    deleteItem,
    clearPurchased,
  };

  return <GroceryContext.Provider value={value}>{children}</GroceryContext.Provider>;
};
