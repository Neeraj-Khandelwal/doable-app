// useFamily hook
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useFamily = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching family members:', error);
    } else {
      setFamilyMembers(data || []);
    }
    setLoading(false);
  };

  const addFamilyMember = async (member) => {
    const { data, error } = await supabase
      .from('family_members')
      .insert([member])
      .select();

    if (error) {
      console.error('Error adding family member:', error);
      return { error };
    } else {
      setFamilyMembers(prev => [data[0], ...prev]);
      return { data: data[0] };
    }
  };

  const updateFamilyMember = async (id, updates) => {
    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating family member:', error);
      return { error };
    } else {
      setFamilyMembers(prev => prev.map(member => 
        member.id === id ? data[0] : member
      ));
      return { data: data[0] };
    }
  };

  const deleteFamilyMember = async (id) => {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting family member:', error);
      return { error };
    } else {
      setFamilyMembers(prev => prev.filter(member => member.id !== id));
      return { success: true };
    }
  };

  return {
    familyMembers,
    loading,
    fetchFamilyMembers,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
  };
};