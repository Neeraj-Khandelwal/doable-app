import { useMemo, useState } from 'react';
import { useRewardsContext } from '../context/RewardsContext';
import { useTaskContext } from '../context/TaskContext';
import { useFamilyContext } from '../context/FamilyContext';
import { useHabitContext } from '../context/HabitContext';
import type { TaskRating } from '../utils/taskModels';
import type { Reward } from '../utils/rewardModels';
import type { KidProfile } from '../utils/familyModels';
import GivePointsModal from '../components/rewards/GivePointsModal';
import KidPointsCard from '../components/rewards/KidPointsCard';
import RewardCard from '../components/rewards/RewardCard';
import RewardModal from '../components/rewards/RewardModal';
import RatingConfigModal from '../components/tasks/RatingConfigModal';

type Tab = 'leaderboard' | 'store' | 'history';

function ResetConfirmPanel({
  kid, balance, resetting, onConfirm, onCancel,
}: {
  kid: KidProfile | null;
  balance: number;
  resetting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="p-4 bg-rose/10 border border-rose/30 rounded-2xl space-y-3">
      <p className="text-sm font-semibold text-ink">
        Reset <span className="text-rose">{kid?.name ?? 'Kid'}</span>'s points to 0?
      </p>
      <p className="text-xs text-ink-3">
        {balance === 0
          ? 'Balance is already 0 — nothing to reset.'
          : `This will deduct ${balance} pts. A reset entry will appear in History.`}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border-2 border-line rounded-xl text-sm font-bold text-ink-3"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={resetting || balance === 0}
          className="flex-1 py-2 bg-rose text-white rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {resetting ? 'Resetting…' : 'Yes, reset'}
        </button>
      </div>
    </div>
  );
}

type PointEvent = {
  key: string;
  taskTitle: string;
  kidId: string;
  ratingType: string;
  points: number;
  date: string;
};

const KID_COLOR_MAP: Record<string, string> = {
  lavender: '#b39ddb',
  peach: '#ffab91',
  mint: '#80cbc4',
  sky: '#81d4fa',
  amber: '#ffd54f',
  rose: '#f48fb1',
};

export default function Rewards() {
  const { rewards, redemptions, kidPointEvents, loading, error, createReward, updateReward, deleteReward, redeemReward, addPointEvent } =
    useRewardsContext();
  const { tasks } = useTaskContext();
  const { kidProfiles, isOwner, ratingConfig, updateRatingConfig } = useFamilyContext();
  const { habits } = useHabitContext();

  const [tab, setTab] = useState<Tab>('leaderboard');
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [ratingConfigOpen, setRatingConfigOpen] = useState(false);
  const [givePointsKidId, setGivePointsKidId] = useState<string | undefined>();
  const [givePointsOpen, setGivePointsOpen] = useState(false);
  const [confirmResetKidId, setConfirmResetKidId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const pointsEarned = useMemo(() => {
    const earned: Record<string, number> = {};
    tasks
      .filter((t) => !!t.completed_at && Array.isArray(t.ratings) && t.ratings.length > 0)
      .forEach((t) => {
        (t.ratings as TaskRating[]).forEach((r) => {
          if (r.kid_id && typeof r.points === 'number') {
            earned[r.kid_id] = (earned[r.kid_id] ?? 0) + r.points;
          }
        });
      });
    kidPointEvents.forEach((e) => {
      earned[e.kid_id] = (earned[e.kid_id] ?? 0) + e.points;
    });
    return earned;
  }, [tasks, kidPointEvents]);

  const pointsSpent = useMemo(() =>
    redemptions.reduce((acc, r) => {
      acc[r.kid_id] = (acc[r.kid_id] ?? 0) + r.points_spent;
      return acc;
    }, {} as Record<string, number>),
    [redemptions]
  );

  const getBalance = (kidId: string) =>
    Math.max(0, (pointsEarned[kidId] ?? 0) - (pointsSpent[kidId] ?? 0));

  const sortedKids = useMemo(
    () => [...kidProfiles].sort((a, b) => getBalance(b.id) - getBalance(a.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kidProfiles, pointsEarned, pointsSpent]
  );

  const pointEvents = useMemo<PointEvent[]>(() => {
    const events: PointEvent[] = [];
    tasks
      .filter((t) => !!t.completed_at && Array.isArray(t.ratings) && t.ratings.length > 0)
      .forEach((t) => {
        (t.ratings as TaskRating[]).forEach((r) => {
          if (r.kid_id && typeof r.points === 'number') {
            events.push({
              key: `task-${t.id}-${r.kid_id}`,
              taskTitle: t.title,
              kidId: r.kid_id,
              ratingType: r.rating_type,
              points: r.points,
              date: t.completed_at!,
            });
          }
        });
      });
    kidPointEvents.forEach((e) => {
      const habit = e.habit_id ? habits.find((h) => h.id === e.habit_id) : null;
      const title = e.type === 'streak_bonus' && habit ? `${habit.icon} ${habit.title}` : e.reason;
      events.push({
        key: `event-${e.id}`,
        taskTitle: title,
        kidId: e.kid_id,
        ratingType: e.type === 'streak_bonus' ? 'streak_bonus' : 'adhoc',
        points: e.points,
        date: e.event_date,
      });
    });
    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [tasks, kidPointEvents, habits]);

  const handleSave = async (data: Partial<Reward>) => {
    const result = editingReward
      ? await updateReward(editingReward.id, data)
      : await createReward(data);
    if (result?.error) throw new Error(result.error);
    setRewardModalOpen(false);
    setEditingReward(null);
  };

  const handleDelete = async () => {
    if (!editingReward) return;
    const result = await deleteReward(editingReward.id);
    if (result?.error) throw new Error(result.error);
    setRewardModalOpen(false);
    setEditingReward(null);
  };

  const handleRedeem = async (rewardId: string, kidId: string) => {
    const result = await redeemReward(rewardId, kidId, getBalance(kidId));
    if (result?.error) throw new Error(result.error);
  };

  const handleResetPoints = async (kidId: string) => {
    const balance = getBalance(kidId);
    if (balance === 0) { setConfirmResetKidId(null); return; }
    setResetting(true);
    await addPointEvent(kidId, -balance, 'Points reset');
    setResetting(false);
    setConfirmResetKidId(null);
  };

  const recentRedemptions = redemptions.slice(0, 5);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'leaderboard', label: '🏆 Points' },
    { key: 'store', label: '🎁 Store' },
    { key: 'history', label: '📜 History' },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Rewards</h1>
        </div>
        {isOwner && (
          <button
            onClick={() => setRatingConfigOpen(true)}
            className="text-xs font-semibold text-lavender bg-plum-soft px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
          >
            ⚙️ Ratings
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-bg-deep rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              tab === t.key ? 'bg-white text-lavender shadow-sm' : 'text-ink-3'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-soft border border-red/20 rounded-xl text-sm text-red">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber" />
        </div>
      ) : (
        <>
          {/* ── LEADERBOARD TAB ── */}
          {tab === 'leaderboard' && (
            <div className="space-y-4">
              {kidProfiles.length === 0 ? (
                <div className="p-4 bg-plum-soft border border-lavender/20 rounded-xl text-sm text-lavender text-center">
                  Add kids in the Family tab to track their points
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {sortedKids.map((kid) => (
                      <KidPointsCard
                        key={kid.id}
                        kid={kid}
                        balance={getBalance(kid.id)}
                        earned={pointsEarned[kid.id] ?? 0}
                        spent={pointsSpent[kid.id] ?? 0}
                        onGivePoints={isOwner ? () => { setGivePointsKidId(kid.id); setGivePointsOpen(true); } : undefined}
                        onReset={isOwner ? () => setConfirmResetKidId(kid.id) : undefined}
                      />
                    ))}
                  </div>

                  {/* Inline reset confirmation */}
                  {confirmResetKidId && (
                    <ResetConfirmPanel
                      kid={kidProfiles.find((k) => k.id === confirmResetKidId) ?? null}
                      balance={getBalance(confirmResetKidId)}
                      resetting={resetting}
                      onConfirm={() => void handleResetPoints(confirmResetKidId)}
                      onCancel={() => setConfirmResetKidId(null)}
                    />
                  )}
                </>
              )}


              {isOwner && kidProfiles.length > 0 && (
                <div
                  className="rounded-2xl p-4 flex flex-col gap-3"
                  style={{ background: 'linear-gradient(135deg, #f3f0fd 0%, #fff9e6 100%)', border: '1.5px solid #e0d7fa' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🌟</span>
                    <div>
                      <p className="font-bold text-ink text-sm">Caught a great moment?</p>
                      <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">
                        Spot good behavior, a kind act, or extra effort? Give bonus points on the spot — little wins add up!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setGivePointsKidId(undefined); setGivePointsOpen(true); }}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
                    style={{ background: 'linear-gradient(90deg, #7C6FF0, #E8A800)' }}
                  >
                    <span>⭐</span> Give Bonus Points
                  </button>
                </div>
              )}

              {recentRedemptions.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-2">
                    🕐 Recent Redemptions
                  </h2>
                  <div className="space-y-2">
                    {recentRedemptions.map((r) => {
                      const kid = kidProfiles.find((k) => k.id === r.kid_id);
                      const reward = rewards.find((rw) => rw.id === r.reward_id);
                      const date = new Date(r.redeemed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return (
                        <div key={r.id} className="flex items-center gap-3 py-2 px-3 bg-bg-deep rounded-xl">
                          <span className="text-lg">{reward?.icon ?? '🎁'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{reward?.title ?? 'Reward'}</p>
                            <p className="text-xs text-ink-4">{kid?.name ?? 'Kid'} · {date}</p>
                          </div>
                          <span className="text-xs font-bold text-rose">−{r.points_spent} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STORE TAB ── */}
          {tab === 'store' && (
            <div className="space-y-3">
              {rewards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🎁</div>
                  <p className="text-ink-3 font-medium">No rewards yet</p>
                  {isOwner && <p className="text-sm text-ink-4 mt-1">Tap + to create the first reward</p>}
                </div>
              ) : (
                rewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    kids={kidProfiles}
                    getBalance={getBalance}
                    onRedeem={(kidId) => handleRedeem(reward.id, kidId)}
                    onEdit={() => { setEditingReward(reward); setRewardModalOpen(true); }}
                    isOwner={isOwner}
                  />
                ))
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === 'history' && (
            <div className="space-y-2">
              {pointEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📜</div>
                  <p className="text-ink-3 font-medium">No points earned yet</p>
                  <p className="text-sm text-ink-4 mt-1">Complete and rate kid tasks to earn points</p>
                </div>
              ) : (
                pointEvents.map((evt) => {
                  const kid = kidProfiles.find((k) => k.id === evt.kidId);
                  const ratingOpt = ratingConfig.find((r) => r.type === evt.ratingType);
                  const kidColor = KID_COLOR_MAP[kid?.color ?? 'lavender'];
                  const date = new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  const isStreakBonus = evt.ratingType === 'streak_bonus';
                  const isAdhoc = evt.ratingType === 'adhoc';
                  const iconEmoji = isStreakBonus ? '🔥' : isAdhoc ? (evt.points >= 0 ? '⭐' : '📉') : (ratingOpt?.emoji ?? '⭐');
                  const iconBg = isStreakBonus ? '#E8A80025' : `${kidColor}25`;
                  return (
                    <div key={evt.key} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-line-soft shadow-sm">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: iconBg }}
                      >
                        {iconEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{evt.taskTitle}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {kid && (
                            <span
                              className="text-xs font-medium px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: kidColor }}
                            >
                              {kid.name}
                            </span>
                          )}
                          <span className="text-xs text-ink-4">
                            {isStreakBonus ? '🔥 7-day streak bonus' : isAdhoc ? '⭐ Adhoc award' : evt.ratingType}
                          </span>
                          <span className="text-xs text-ink-4">·</span>
                          <span className="text-xs text-ink-4">{date}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-extrabold flex-shrink-0 ${evt.points >= 0 ? 'text-green' : 'text-rose'}`}>
                        {evt.points >= 0 ? '+' : ''}{evt.points}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {isOwner && tab === 'store' && (
        <button
          onClick={() => { setEditingReward(null); setRewardModalOpen(true); }}
          className="fixed bottom-24 right-4 w-14 h-14 bg-ink text-bg rounded-2xl shadow-lg text-2xl font-bold flex items-center justify-center hover:opacity-80 transition-all active:scale-95 z-40"
          aria-label="Add reward"
        >
          +
        </button>
      )}

      <RewardModal
        isOpen={rewardModalOpen}
        onClose={() => { setRewardModalOpen(false); setEditingReward(null); }}
        onSave={handleSave}
        onDelete={editingReward ? handleDelete : undefined}
        reward={editingReward}
      />

      <RatingConfigModal
        isOpen={ratingConfigOpen}
        onClose={() => setRatingConfigOpen(false)}
        currentOptions={ratingConfig}
        onSave={async (opts) => { await updateRatingConfig(opts); }}
      />

      <GivePointsModal
        isOpen={givePointsOpen}
        onClose={() => setGivePointsOpen(false)}
        kids={kidProfiles}
        defaultKidId={givePointsKidId}
        onSave={addPointEvent}
      />
    </div>
  );
}
