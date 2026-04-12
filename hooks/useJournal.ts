'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface JournalEntry {
  id?: string;
  date: string;
  mood: number | null;
  gratitude: string[];
  intention: string;
  water_glasses: number;
}

const defaultEntry = (date: string): JournalEntry => ({
  date,
  mood: null,
  gratitude: ['', '', ''],
  intention: '',
  water_glasses: 0,
});

export function useJournal() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [journal, setJournal] = useState<JournalEntry>(defaultEntry(today));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJournal = async () => {
      const { data } = await supabase
        .from('daily_journal')
        .select('*')
        .eq('date', today)
        .maybeSingle();
      if (data) setJournal(data as JournalEntry);
      setLoading(false);
    };
    fetchJournal();
  }, [today]);

  const updateJournal = async (updates: Partial<Omit<JournalEntry, 'id' | 'date'>>) => {
    setJournal(prev => ({ ...prev, ...updates }));
    await supabase
      .from('daily_journal')
      .upsert({ date: today, ...updates }, { onConflict: 'date' });
  };

  return { journal, loading, updateJournal };
}
