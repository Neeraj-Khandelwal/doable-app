import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useRewardsContext } from '../context/RewardsContext';
import { useTaskContext } from '../context/TaskContext';
import { useFamilyContext } from '../context/FamilyContext';
import { useHabitContext } from '../context/HabitContext';
import type { TaskRating } from '../utils/taskModels';
import type { Reward } from '../utils/rewardModels';
import GivePointsModal from '../components/rewards/GivePointsModal';
import KidPointsCard from '../components/rewards/KidPointsCard';
import RewardCard from '../components/rewards/RewardCard';
import RewardModal from '../components/rewards/RewardModal';
import RatingConfigModal from '../components/tasks/RatingConfigModal';
import HabitPointsConfigModal from '../components/rewards/HabitPointsConfigModal';

type Tab = 'leaderboard' | 'store' | 'history';

type PointEvent = {
  key: string;
  taskTitle: string;
  kidId: string;
  ratingType: string;
  points: number;
  date: string;
  photoUrl?: string | null;
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
  const { user } = useAuthContext();
  const { rewards, redemptions, kidPointEvents, loading, error, createReward, updateReward, deleteReward, redeemReward, addPointEvent, resetKidPoints } =
    useRewardsContext();
  const { tasks } = useTaskContext();
  const { family, kidProfiles, isOwner, ratingConfig, updateRatingConfig, habitPointsConfig, updateHabitPointsConfig } = useFamilyContext();
  const { habits } = useHabitContext();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('leaderboard');
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [ratingConfigOpen, setRatingConfigOpen] = useState(false);
  const [habitPointsConfigOpen, setHabitPointsConfigOpen] = useState(false);
  const [givePointsKidId, setGivePointsKidId] = useState<string | undefined>();
  const [givePointsOpen, setGivePointsOpen] = useState(false);
  const [resetKidId, setResetKidId] = useState<string | undefined>();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetResetting, setResetResetting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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
        photoUrl: e.photo_url,
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

  const handleResetConfirm = async (includeHistory: boolean) => {
    if (!resetKidId) return;
    setResetResetting(true);
    await resetKidPoints(resetKidId, includeHistory, getBalance(resetKidId));
    setResetResetting(false);
    setResetModalOpen(false);
    setResetKidId(undefined);
  };

  const recentRedemptions = redemptions.slice(0, 5);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'leaderboard', label: '🏆 Points' },
    { key: 'store', label: '🎁 Store' },
    { key: 'history', label: '📜 History' },
  ];

  const resetKid = kidProfiles.find((k) => k.id === resetKidId);

  if (!loading && !family) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="text-5xl mb-4">⭐</div>
        <h2 className="text-xl font-extrabold text-ink mb-2">No family yet</h2>
        <p className="text-sm text-ink-3 mb-6">Create or join a family to set up rewards for your kids.</p>
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
    <div className="space-y-4 pb-4">

      {/* Global image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white text-3xl font-bold leading-none hover:opacity-80"
          >
            ×
          </button>
          <img
            src={lightboxUrl}
            alt="Reward"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Reset points modal */}
      {resetModalOpen && resetKid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Reset points for {resetKid.name}</h2>
            <p className="text-sm text-gray-500">
              Current balance: <strong>{getBalance(resetKid.id)} pts</strong>
            </p>
            <p className="text-sm text-gray-600">What do you want to reset?</p>
            <div className="space-y-2">
              <button
                disabled={resetResetting}
                onClick={() => void handleResetConfirm(false)}
                className="w-full py-3 rounded-xl border-2 border-amber text-amber font-semibold text-sm hover:bg-amber/10 transition-colors disabled:opacity-50"
              >
                Reset balance to 0
                <p className="text-xs font-normal text-gray-400 mt-0.5">Adds a correction entry — history stays visible</p>
              </button>
              <button
                disabled={resetResetting}
                onClick={() => void handleResetConfirm(true)}
                className="w-full py-3 rounded-xl border-2 border-rose text-rose font-semibold text-sm hover:bg-rose/10 transition-colors disabled:opacity-50"
              >
                Reset balance + clear all history
                <p className="text-xs font-normal text-gray-400 mt-0.5">Deletes all point events and redemptions</p>
              </button>
            </div>
            <button
              onClick={() => { setResetModalOpen(false); setResetKidId(undefined); }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Rewards</h1>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setHabitPointsConfigOpen(true)}
              className="text-xs font-semibold text-amber bg-amber/10 px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
            >
              ⚙️ Habits
            </button>
            <button
              onClick={() => setRatingConfigOpen(true)}
              className="text-xs font-semibold text-lavender bg-plum-soft px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
            >
              ⚙️ Ratings
            </button>
          </div>
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
                <div className="flex flex-col items-center text-center py-10 px-6">
                  <div className="text-5xl mb-4">⭐</div>
                  <p className="font-bold text-ink mb-1">No kid profiles yet</p>
                  <p className="text-sm text-ink-4 mb-5">Add kids in the Family tab to start tracking their points and rewards.</p>
                  <button
                    onClick={() => navigate('/family')}
                    className="px-5 py-2.5 bg-lavender text-white text-sm font-bold rounded-2xl hover:opacity-90 transition-all active:scale-95"
                  >
                    Go to Family tab
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {sortedKids.map((kid) => (
                    <KidPointsCard
                      key={kid.id}
                      kid={kid}
                      balance={getBalance(kid.id)}
                      earned={pointsEarned[kid.id] ?? 0}
                      spent={pointsSpent[kid.id] ?? 0}
                      onReset={isOwner ? () => { setResetKidId(kid.id); setResetModalOpen(true); } : undefined}
                    />
                  ))}
                </div>
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
                      const hasImage = !!reward?.image_url;
                  return (
                        <div key={r.id} className="flex items-center gap-3 py-2 px-3 bg-bg-deep rounded-xl">
                          <button
                            className={`flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center ${hasImage ? 'cursor-pointer' : 'cursor-default'}`}
                            onClick={hasImage ? () => setLightboxUrl(reward!.image_url!) : undefined}
                            aria-label={hasImage ? 'View full image' : undefined}
                          >
                            {hasImage ? (
                              <img src={reward!.image_url!} alt={reward!.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">{reward?.icon ?? '🎁'}</span>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{reward?.title ?? 'Reward'}</p>
                            <p className="text-xs text-ink-4">
                              {kid?.name ?? 'Kid'} · {date}
                              {hasImage && <span className="ml-1 text-lavender">· tap image to expand</span>}
                            </p>
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
                    <div key={evt.key} className="bg-white rounded-xl border border-line-soft shadow-sm overflow-hidden">
                      {/* Photo (if present) */}
                      {evt.photoUrl && (
                        <button
                          className="w-full relative block"
                          onClick={() => setLightboxUrl(evt.photoUrl!)}
                        >
                          <img
                            src={evt.photoUrl}
                            alt="Moment"
                            className="w-full h-40 object-cover"
                          />
                          <span className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
                            tap to expand
                          </span>
                        </button>
                      )}
                      <div className="flex items-center gap-3 p-3">
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
                              {isStreakBonus ? '🔥 Streak bonus' : isAdhoc ? '⭐ Adhoc award' : evt.ratingType}
                            </span>
                            <span className="text-xs text-ink-4">·</span>
                            <span className="text-xs text-ink-4">{date}</span>
                          </div>
                        </div>
                        <span className={`text-sm font-extrabold flex-shrink-0 ${evt.points >= 0 ? 'text-green' : 'text-rose'}`}>
                          {evt.points >= 0 ? '+' : ''}{evt.points}
                        </span>
                      </div>
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
        userId={user?.id ?? ''}
        onSave={addPointEvent}
      />

      <HabitPointsConfigModal
        isOpen={habitPointsConfigOpen}
        onClose={() => setHabitPointsConfigOpen(false)}
        current={habitPointsConfig}
        onSave={async (cfg) => { await updateHabitPointsConfig(cfg); }}
      />
    </div>
  );
}
