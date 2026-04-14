'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Milestone {
  id: string;
  goal_id: string;
  text: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  deadline: string;
  color: string;
  milestones: Milestone[];
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchGoals = async () => {
      const [goalsRes, milestonesRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('milestones').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      ]);
      if (goalsRes.error || milestonesRes.error) { setLoading(false); return; }
      const milestones = (milestonesRes.data || []) as Milestone[];
      const merged: Goal[] = (goalsRes.data || []).map(g => {
        const gMilestones = milestones.filter(m => m.goal_id === g.id);
        const progress = gMilestones.length > 0
          ? Math.round((gMilestones.filter(m => m.done).length / gMilestones.length) * 100)
          : g.progress;
        return { ...g, milestones: gMilestones, progress };
      });
      setGoals(merged);
      setLoading(false);
    };
    fetchGoals();
  }, [userId]);

  const addGoal = async (goal: Omit<Goal, 'id' | 'milestones' | 'progress'>): Promise<Goal | null> => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, progress: 0, user_id: userId })
      .select()
      .single();
    if (!error && data) {
      const newGoal: Goal = { ...data, milestones: [], progress: 0 };
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    }
    return null;
  };

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const milestone = goal.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    const done = !milestone.done;

    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const milestones = g.milestones.map(m => m.id === milestoneId ? { ...m, done } : m);
      const progress = milestones.length > 0
        ? Math.round((milestones.filter(m => m.done).length / milestones.length) * 100)
        : 0;
      return { ...g, milestones, progress };
    }));

    await supabase.from('milestones').update({ done }).eq('id', milestoneId);

    // Recalculate and persist progress
    const updatedMilestones = goal.milestones.map(m => m.id === milestoneId ? { ...m, done } : m);
    const progress = updatedMilestones.length > 0
      ? Math.round((updatedMilestones.filter(m => m.done).length / updatedMilestones.length) * 100)
      : 0;
    await supabase.from('goals').update({ progress }).eq('id', goalId);
  };

  const addMilestone = async (goalId: string, text: string) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('milestones')
      .insert({ goal_id: goalId, text, done: false, user_id: userId })
      .select()
      .single();
    if (!error && data) {
      setGoals(prev => prev.map(g => {
        if (g.id !== goalId) return g;
        const milestones = [...g.milestones, data as Milestone];
        const progress = Math.round((milestones.filter(m => m.done).length / milestones.length) * 100);
        return { ...g, milestones, progress };
      }));
    }
  };

  return { goals, loading, addGoal, toggleMilestone, addMilestone };
}
