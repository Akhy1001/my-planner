'use client';
import { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, addDays, addWeeks, addMonths } from 'date-fns';
import { supabase } from '@/lib/supabase';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  duration: string;
  color: string;
  category: string;
  recurrence: RecurrenceType;
  /** Pour les occurrences virtuelles : ID de l'événement de base en BDD */
  baseId?: string;
}

interface DbEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  color: string;
  category: string;
  recurrence: RecurrenceType;
}

function toEvent(db: DbEvent): Event {
  return {
    ...db,
    date: startOfDay(parseISO(db.date)),
    recurrence: (db.recurrence as RecurrenceType) || 'none',
  };
}

/** Génère les occurrences virtuelles d'un événement récurrent sur ±12 mois */
function expandRecurring(event: Event): Event[] {
  if (!event.recurrence || event.recurrence === 'none') return [event];

  const occurrences: Event[] = [];
  const now = new Date();
  const rangeStart = startOfDay(addMonths(now, -12));
  const rangeEnd = startOfDay(addMonths(now, 12));

  let cursor = startOfDay(event.date);

  // Avancer jusqu'au début de la plage si l'événement est trop ancien
  while (cursor < rangeStart) {
    cursor = nextOccurrence(cursor, event.recurrence);
  }

  let safety = 0;
  while (cursor <= rangeEnd && safety < 800) {
    safety++;
    occurrences.push({
      ...event,
      id: `${event.id}_${format(cursor, 'yyyy-MM-dd')}`,
      date: cursor,
      baseId: event.id,
    });
    cursor = nextOccurrence(cursor, event.recurrence);
  }

  return occurrences;
}

function nextOccurrence(date: Date, recurrence: RecurrenceType): Date {
  switch (recurrence) {
    case 'daily':   return addDays(date, 1);
    case 'weekly':  return addWeeks(date, 1);
    case 'monthly': return addMonths(date, 1);
    default:        return date;
  }
}

export function useEvents() {
  const [baseEvents, setBaseEvents] = useState<Event[]>([]);
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
      if (!error && data) setBaseEvents((data as DbEvent[]).map(toEvent));
      setLoading(false);
    };
    fetchEvents();
  }, [userId]);

  /** Événements affichés : base + occurrences virtuelles des récurrents */
  const events: Event[] = baseEvents.flatMap(expandRecurring);

  const addEvent = async (event: Omit<Event, 'id' | 'baseId'>) => {
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
        recurrence: event.recurrence,
        user_id: userId,
      })
      .select()
      .single();
    if (!error && data) setBaseEvents(prev => [...prev, toEvent(data as DbEvent)]);
  };

  const updateEvent = async (id: string, fields: Partial<Omit<Event, 'id' | 'baseId'>>) => {
    const patch: Partial<DbEvent> = { ...fields } as Partial<DbEvent>;
    if (fields.date) {
      patch.date = format(startOfDay(fields.date), 'yyyy-MM-dd');
    }
    const { data, error } = await supabase
      .from('events')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      setBaseEvents(prev => prev.map(e => e.id === id ? toEvent(data as DbEvent) : e));
    }
  };

  const removeEvent = async (id: string) => {
    setBaseEvents(prev => prev.filter(e => e.id !== id));
    await supabase.from('events').delete().eq('id', id);
  };

  return { events, loading, addEvent, updateEvent, removeEvent };
}
