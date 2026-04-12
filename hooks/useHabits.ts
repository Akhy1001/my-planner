'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  completedDays: string[];
  streak: number;
  target: number;
}

function computeStreak(completedDays: string[]): number {
  if (!completedDays.length) return 0;
  const sorted = [...completedDays].sort().reverse();
  const today = format(new Date(), 'yyyy-MM-dd');
  let streak = 0;
  let current = today;
  for (const day of sorted) {
    if (day === current) {
      streak++;
      const d = new Date(current + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      current = format(d, 'yyyy-MM-dd');
    } else if (day < current) {
      break;
    }
  }
  return streak;
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHabits = async () => {
      const [habitsRes, completionsRes] = await Promise.all([
        supabase.from('habits').select('*').order('created_at', { ascending: true }),
        supabase.from('habit_completions').select('*'),
      ]);
      if (habitsRes.error || completionsRes.error) { setLoading(false); return; }
      const completions = completionsRes.data || [];
      const merged: Habit[] = (habitsRes.data || []).map(h => {
        const completedDays = completions
          .filter((c: { habit_id: string; completed_date: string }) => c.habit_id === h.id)
          .map((c: { completed_date: string }) => c.completed_date);
        return { ...h, completedDays, streak: computeStreak(completedDays) };
      });
      setHabits(merged);
      setLoading(false);
    };
    fetchHabits();
  }, []);

  const toggleToday = async (habitId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const done = habit.completedDays.includes(today);
    if (done) {
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        const completedDays = h.completedDays.filter(d => d !== today);
        return { ...h, completedDays, streak: computeStreak(completedDays) };
      }));
      await supabase.from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('completed_date', today);
    } else {
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        const completedDays = [...h.completedDays, today];
        return { ...h, completedDays, streak: computeStreak(completedDays) };
      }));
      await supabase.from('habit_completions')
        .insert({ habit_id: habitId, completed_date: today });
    }
  };

  const addHabit = async (habit: { name: string; icon: string; color: string; target: number }) => {
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single();
    if (!error && data) setHabits(prev => [...prev, { ...data, completedDays: [], streak: 0 }]);
  };

  return { habits, loading, toggleToday, addHabit };
}
