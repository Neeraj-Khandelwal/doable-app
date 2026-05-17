import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from './AuthContext';
import { useFamilyContext } from './FamilyContext';
import type { Reward, RewardRedemption, KidPointEvent } from '../utils/rewardModels';
import { todayStr } from '../utils/habitModels';

type RewardsContextValue = {
  rewards: Reward[];
  redemptions: RewardRedemption[];
  kidPointEvents: KidPointEvent[];
  loading: boolean;
  error: string | null;
  createReward: (data: Partial<Reward>) => Promise<{ data?: Reward; error?: string }>;
  updateReward: (id: string, updates: Partial<Reward>) => Promise<{ data?: Reward; error?: string }>;
  deleteReward: (id: string) => Promise<{ error?: string }>;
  redeemReward: (rewardId: string, kidId: string, currentBalance: number) => Promise<{ error?: string }>;
  addPointEvent: (kidId: string, points: number, reason: string, photoUrl?: string | null) => Promise<{ error?: string }>;
  refreshRewards: () => Promise<void>;
};

const RewardsContext = createContext<RewardsContextValue | undefined>(undefined);

export const useRewardsContext = () => {
  const ctx = useContext(RewardsContext);
  if (!ctx) throw new Error('useRewardsContext must be used within RewardsProvider');
  return ctx;
};

export const RewardsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const { family } = useFamilyContext();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [kidPointEvents, setKidPointEvents] = useState<KidPointEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!family?.id) {
      setRewards([]);
      setRedemptions([]);
      setKidPointEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [rewardsRes, redemptionsRes, eventsRes] = await Promise.all([
      supabase
        .from('rewards')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('points_cost', { ascending: true }),
      supabase
        .from('reward_redemptions')
        .select('*')
        .eq('family_id', family.id)
        .eq('status', 'approved')
        .order('redeemed_at', { ascending: false }),
      supabase
        .from('kid_point_events')
        .select('*')
        .eq('family_id', family.id)
        .order('event_date', { ascending: false }),
    ]);

    if (rewardsRes.error) setError('Unable to load rewards.');
    else setRewards((rewardsRes.data ?? []) as Reward[]);

    if (!redemptionsRes.error) setRedemptions((redemptionsRes.data ?? []) as RewardRedemption[]);
    if (!eventsRes.error) setKidPointEvents((eventsRes.data ?? []) as KidPointEvent[]);

    setLoading(false);
  }, [family?.id]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const createReward = async (data: Partial<Reward>) => {
    if (!family?.id || !user?.id) return { error: 'Not authenticated' };

    const { data: created, error: insertError } = await supabase
      .from('rewards')
      .insert([{
        family_id: family.id,
        created_by: user.id,
        title: data.title,
        description: data.description ?? null,
        icon: data.icon ?? '🎁',
        points_cost: data.points_cost ?? 10,
        is_active: true,
      }])
      .select()
      .single();

    if (insertError) return { error: insertError.message };
    setRewards((prev) => [...prev, created as Reward].sort((a, b) => a.points_cost - b.points_cost));
    return { data: created as Reward };
  };

  const updateReward = async (id: string, updates: Partial<Reward>) => {
    const { data: updated, error: updateError } = await supabase
      .from('rewards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) return { error: updateError.message };
    setRewards((prev) =>
      prev.map((r) => (r.id === id ? (updated as Reward) : r)).sort((a, b) => a.points_cost - b.points_cost)
    );
    return { data: updated as Reward };
  };

  const deleteReward = async (id: string) => {
    const { error: updateError } = await supabase.from('rewards').update({ is_active: false }).eq('id', id);
    if (updateError) return { error: updateError.message };
    setRewards((prev) => prev.filter((r) => r.id !== id));
    return {};
  };

  const redeemReward = async (rewardId: string, kidId: string, currentBalance: number) => {
    if (!family?.id) return { error: 'No family' };
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return { error: 'Reward not found' };
    if (currentBalance < reward.points_cost) return { error: 'Not enough points' };

    const { data: redemption, error: insertError } = await supabase
      .from('reward_redemptions')
      .insert([{ reward_id: rewardId, family_id: family.id, kid_id: kidId, points_spent: reward.points_cost, status: 'approved' }])
      .select()
      .single();

    if (insertError) return { error: insertError.message };
    setRedemptions((prev) => [redemption as RewardRedemption, ...prev]);
    return {};
  };

  const addPointEvent = async (kidId: string, points: number, reason: string, photoUrl?: string | null) => {
    if (!family?.id || !user?.id) return { error: 'Not authenticated' };
    if (points === 0) return { error: 'Points cannot be zero' };
    if (!reason.trim()) return { error: 'Reason is required' };

    const { data: evt, error: insertError } = await supabase
      .from('kid_point_events')
      .insert([{
        kid_id: kidId,
        family_id: family.id,
        points,
        reason: reason.trim(),
        type: 'adhoc',
        habit_id: null,
        photo_url: photoUrl ?? null,
        created_by: user.id,
        event_date: todayStr(),
      }])
      .select()
      .single();

    if (insertError) return { error: insertError.message };
    setKidPointEvents((prev) => [evt as KidPointEvent, ...prev]);
    return {};
  };

  return (
    <RewardsContext.Provider
      value={{
        rewards,
        redemptions,
        kidPointEvents,
        loading,
        error,
        createReward,
        updateReward,
        deleteReward,
        redeemReward,
        addPointEvent,
        refreshRewards: fetchAll,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
};
