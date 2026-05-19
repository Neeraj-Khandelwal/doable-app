export interface Reward {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  points_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  family_id: string;
  kid_id: string; // kid_profile id
  points_spent: number;
  status: 'approved'; // auto-approved for MVP
  redeemed_at: string;
  created_at: string;
}

export type PointEventType = 'adhoc' | 'streak_bonus';

export interface KidPointEvent {
  id: string;
  kid_id: string;
  family_id: string;
  points: number;        // positive = award, negative = deduction
  reason: string;
  type: PointEventType;
  habit_id: string | null;
  created_by: string;
  event_date: string;    // YYYY-MM-DD
  created_at: string;
}

export const REWARD_ICONS = [
  '🎁', '🎮', '🍕', '🍦', '🎬', '🎪', '🎨', '🎵',
  '🧸', '🎠', '📱', '🎒', '🚂', '🦄', '🌈', '⭐',
  '🏆', '🎯', '🎲', '🍫', '🎡', '🎭', '🏖️', '🛴',
];

export const POINT_PRESETS = [5, 10, 15, 20, 25, 30, 50, 100];
