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
  water_target: number;
  reading_pages: number;
  reading_target: number;
}

const defaultEntry = (date: string): JournalEntry => ({
  date,
  mood: null,
  gratitude: ['', '', ''],
  water_glasses: 0,
  water_target: 8,
  reading_pages: 0,
  reading_target: 20,
});

export function useJournal() {
  const [today, setToday] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [journal, setJournal] = useState<JournalEntry>(() => defaultEntry(format(new Date(), 'yyyy-MM-dd')));
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const checkDate = () => setToday(format(new Date(), 'yyyy-MM-dd'));
    document.addEventListener('visibilitychange', checkDate);
    return () => document.removeEventListener('visibilitychange', checkDate);
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
    const previous = journal;
    setJournal(prev => ({ ...prev, ...updates }));
    const { error } = await supabase
      .from('daily_journal')
      .upsert({ date: today, user_id: userId, ...updates }, { onConflict: 'date,user_id' });
    if (error) {
      console.error('[useJournal] updateJournal failed:', error.message);
      setJournal(previous);
    }
  };

  return { journal, loading, updateJournal };
}
