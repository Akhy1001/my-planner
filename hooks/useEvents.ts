'use client';
import { useState, useEffect } from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  duration: string;
  color: string;
  category: string;
}

interface DbEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  color: string;
  category: string;
}

function toEvent(db: DbEvent): Event {
  return { ...db, date: startOfDay(parseISO(db.date)) };
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (!error && data) setEvents((data as DbEvent[]).map(toEvent));
      setLoading(false);
    };
    fetchEvents();
  }, [userId]);

  const addEvent = async (event: Omit<Event, 'id'>) => {
    if (!userId) return;
    const localDate = format(startOfDay(event.date), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: event.title,
        date: localDate,
        time: event.time,
        duration: event.duration,
        color: event.color,
        category: event.category,
        user_id: userId,
      })
      .select()
      .single();
    if (!error && data) setEvents(prev => [...prev, toEvent(data as DbEvent)]);
  };

  const removeEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    await supabase.from('events').delete().eq('id', id);
  };

  return { events, loading, addEvent, removeEvent };
}
