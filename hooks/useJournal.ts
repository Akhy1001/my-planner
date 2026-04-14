'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface JournalEntry {
  id?: string;
  date: string;
  mood: number | null;
  gratitude: string[];
  water_glasses: number;
}

const defaultEntry = (date: string): JournalEntry => ({
  date,
  mood: null,
  gratitude: ['', '', ''],
  water_glasses: 0,
});

export function useJournal() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [journal, setJournal] = useState<JournalEntry>(defaultEntry(today));
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchJournal = async () => {
      const { data } = await supabase
        .from('daily_journal')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
      if (data) setJournal(data as JournalEntry);
      setLoading(false);
    };
    fetchJournal();
  }, [userId, today]);

  const updateJournal = async (updates: Partial<Omit<JournalEntry, 'id' | 'date'>>) => {
    if (!userId) return;
    setJournal(prev => ({ ...prev, ...updates }));
    await supabase
      .from('daily_journal')
      .upsert({ date: today, user_id: userId, ...updates }, { onConflict: 'date,user_id' });
  };

  return { journal, loading, updateJournal };
}
