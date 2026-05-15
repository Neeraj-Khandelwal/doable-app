/**
 * Family Data Models
 * TypeScript type definitions for family management features
 */

export type FamilyColor = 'lavender' | 'peach' | 'mint' | 'sky' | 'amber' | 'rose';

import type { RatingOption } from './taskModels';

export interface Family {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string | null;
  max_members: number;
  rating_config: RatingOption[] | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'owner' | 'partner';
  display_name: string | null;
  joined_at: string;
}

export interface KidProfile {
  id: string;
  family_id: string;
  name: string;
  color: FamilyColor;
  created_at: string;
  order: number;
}

/**
 * Utility functions for family data validation
 */
export const validateFamilyName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

export const validateKidName = (name: string): boolean => {
  return name.trim().length >= 1 && name.trim().length <= 30;
};

export const isValidFamilyColor = (color: string): color is FamilyColor => {
  return ['lavender', 'peach', 'mint', 'sky', 'amber', 'rose'].includes(color);
};

/**
 * Default values for family entities
 */
export const DEFAULT_FAMILY_MAX_MEMBERS = 6;

export const DEFAULT_FAMILY_COLORS: FamilyColor[] = [
  'lavender',
  'peach',
  'mint',
  'sky',
  'amber',
  'rose'
];
