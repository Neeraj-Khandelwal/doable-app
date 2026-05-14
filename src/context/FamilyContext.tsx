import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from './AuthContext';
import type { Family, FamilyMember, KidProfile } from '../utils/familyModels';
import { type RatingOption, DEFAULT_RATING_OPTIONS } from '../utils/taskModels';

const generateInviteCodeValue = () => Math.random().toString(36).slice(2, 8).toUpperCase();

type FamilyContextValue = {
  family: Family | null;
  familyMembers: FamilyMember[];
  kidProfiles: KidProfile[];
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  createFamily: (name: string) => Promise<{ data?: Family; error?: any }>;
  joinFamily: (inviteCode: string) => Promise<{ data?: Family; error?: any }>;
  generateInviteCode: () => Promise<{ data?: Family; error?: any }>;
  ratingConfig: RatingOption[];
  updateRatingConfig: (options: RatingOption[]) => Promise<{ error?: any }>;
  updateFamily: (updates: Partial<Pick<Family, 'name' | 'invite_code'>>) => Promise<{ data?: Family; error?: any }>;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => Promise<{ data?: FamilyMember; error?: any }>;
  removeFamilyMember: (id: string) => Promise<{ success?: boolean; error?: any }>;
  addKidProfile: (name: string, color: string) => Promise<{ data?: KidProfile; error?: any }>;
  updateKidProfile: (id: string, updates: Partial<KidProfile>) => Promise<{ data?: KidProfile; error?: any }>;
  removeKidProfile: (id: string) => Promise<{ success?: boolean; error?: any }>;
  refreshFamilyData: () => Promise<void>;
};

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

export const useFamilyContext = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamilyContext must be used within a FamilyProvider');
  }
  return context;
};

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFamilyMembers = async (familyId: string) => {
    const { data, error: fetchError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .order('joined_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching family members:', fetchError);
      setError('Unable to load family members.');
      return [] as FamilyMember[];
    }

    return (data ?? []) as FamilyMember[];
  };

  const fetchKidProfiles = async (familyId: string) => {
    const { data, error: fetchError } = await supabase
      .from('kid_profiles')
      .select('*')
      .eq('family_id', familyId)
      .order('order', { ascending: true });

    if (fetchError) {
      console.error('Error fetching kid profiles:', fetchError);
      setError('Unable to load kid profiles.');
      return [] as KidProfile[];
    }

    return (data ?? []) as KidProfile[];
  };

  const fetchFamilyData = useCallback(async () => {
    if (!user?.id) {
      setFamily(null);
      setFamilyMembers([]);
      setKidProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: membershipData, error: membershipError } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipError) throw membershipError;

      if (membershipData) {
        const fam = membershipData.families as Family;
        setFamily(fam);
        const members = await fetchFamilyMembers(fam.id);
        setFamilyMembers(members);
        const kids = await fetchKidProfiles(fam.id);
        setKidProfiles(kids);
      } else {
        const { data: ownedFamily, error: ownedFamilyError } = await supabase
          .from('families')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (ownedFamilyError) throw ownedFamilyError;

        if (ownedFamily) {
          setFamily(ownedFamily as Family);
          const members = await fetchFamilyMembers(ownedFamily.id);
          setFamilyMembers(members);
          const kids = await fetchKidProfiles(ownedFamily.id);
          setKidProfiles(kids);
        } else {
          setFamily(null);
          setFamilyMembers([]);
          setKidProfiles([]);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching family data:', err);
      setError(message);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchFamilyData();
  }, [fetchFamilyData]);

  const refreshFamilyData = async () => {
    await fetchFamilyData();
  };

  const updateFamily = async (updates: Partial<Pick<Family, 'name' | 'invite_code'>>) => {
    if (!family) {
      return { error: new Error('No family available') };
    }

    const { data, error: updateError } = await supabase
      .from('families')
      .update(updates)
      .eq('id', family.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating family:', updateError);
      return { error: updateError };
    }

    setFamily(data as Family);
    return { data: data as Family };
  };

  const createFamily = async (name: string) => {
    if (!user?.id) {
      return { error: new Error('User must be signed in') };
    }

    const invite_code = generateInviteCodeValue();
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert([{ name, owner_id: user.id, invite_code }])
      .select()
      .single();

    if (familyError) {
      console.error('Error creating family:', familyError);
      return { error: familyError };
    }

    const fam = familyData as Family;
    const { data: memberData, error: memberError } = await supabase
      .from('family_members')
      .insert([
        {
          user_id: user.id,
          family_id: fam.id,
          role: 'owner',
        },
      ])
      .select()
      .single();

    if (memberError) {
      console.error('Error adding owner as member:', memberError);
      return { error: memberError };
    }

    setFamily(fam);
    setFamilyMembers([memberData as FamilyMember]);
    setKidProfiles([]);

    return { data: fam };
  };

  const joinFamily = async (inviteCode: string) => {
    if (!user?.id) {
      return { error: new Error('User must be signed in') };
    }

    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (familyError) {
      console.error('Error finding family by invite code:', familyError);
      return { error: familyError };
    }

    const fam = familyData as Family;
    const { data: existingMember, error: existingMemberError } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('family_id', fam.id)
      .maybeSingle();

    if (existingMemberError) {
      console.error('Error checking membership:', existingMemberError);
      return { error: existingMemberError };
    }

    if (existingMember) {
      setFamily(fam);
      const members = await fetchFamilyMembers(fam.id);
      setFamilyMembers(members);
      const kids = await fetchKidProfiles(fam.id);
      setKidProfiles(kids);
      return { data: fam };
    }

    const { data: memberData, error: memberError } = await supabase
      .from('family_members')
      .insert([
        {
          user_id: user.id,
          family_id: fam.id,
          role: 'partner',
        },
      ])
      .select()
      .single();

    if (memberError) {
      console.error('Error joining family:', memberError);
      return { error: memberError };
    }

    setFamily(fam);
    setFamilyMembers((prev) => [...prev, memberData as FamilyMember]);
    const kids = await fetchKidProfiles(fam.id);
    setKidProfiles(kids);
    return { data: fam };
  };

  const generateInviteCode = async () => {
    if (!family) {
      return { error: new Error('No family available') };
    }

    const invite_code = generateInviteCodeValue();
    return updateFamily({ invite_code });
  };

  const updateFamilyMember = async (id: string, updates: Partial<FamilyMember>) => {
    const { data, error: updateError } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating family member:', updateError);
      return { error: updateError };
    }

    const updatedMember = data as FamilyMember;
    setFamilyMembers((prev) => prev.map((member) => (member.id === id ? updatedMember : member)));
    return { data: updatedMember };
  };

  const removeFamilyMember = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error removing family member:', deleteError);
      return { error: deleteError };
    }

    setFamilyMembers((prev) => prev.filter((member) => member.id !== id));
    return { success: true };
  };

  const addKidProfile = async (name: string, color: string) => {
    if (!family) {
      return { error: new Error('No family available') };
    }

    const { data, error: insertError } = await supabase
      .from('kid_profiles')
      .insert([{ family_id: family.id, name, color }])
      .select()
      .single();

    if (insertError) {
      console.error('Error adding kid profile:', insertError);
      return { error: insertError };
    }

    const kidProfile = data as KidProfile;
    setKidProfiles((prev) => [...prev, kidProfile]);
    return { data: kidProfile };
  };

  const updateKidProfile = async (id: string, updates: Partial<KidProfile>) => {
    const { data, error: updateError } = await supabase
      .from('kid_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating kid profile:', updateError);
      return { error: updateError };
    }

    const updatedKid = data as KidProfile;
    setKidProfiles((prev) => prev.map((kid) => (kid.id === id ? updatedKid : kid)));
    return { data: updatedKid };
  };

  const removeKidProfile = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('kid_profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error removing kid profile:', deleteError);
      return { error: deleteError };
    }

    setKidProfiles((prev) => prev.filter((kid) => kid.id !== id));
    return { success: true };
  };

  const ratingConfig: RatingOption[] = useMemo(
    () => family?.rating_config ?? DEFAULT_RATING_OPTIONS,
    [family]
  );

  const updateRatingConfig = async (options: RatingOption[]) => {
    return updateFamily({ rating_config: options } as any);
  };

  const isOwner = useMemo(
    () => !!family && user?.id === family.owner_id,
    [family, user]
  );

  const value: FamilyContextValue = {
    family,
    familyMembers,
    kidProfiles,
    loading,
    error,
    isOwner,
    ratingConfig,
    updateRatingConfig,
    createFamily,
    joinFamily,
    generateInviteCode,
    updateFamily,
    updateFamilyMember,
    removeFamilyMember,
    addKidProfile,
    updateKidProfile,
    removeKidProfile,
    refreshFamilyData,
  };

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
};
