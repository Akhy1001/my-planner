'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface Note {
  id: string;
  title: string;
  content: string;
  tag: string;
  color: string;
  pinned: boolean;
  updated_at: string;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (!error && data) setNotes(data as Note[]);
      setLoading(false);
    };
    fetchNotes();
  }, [userId]);

  const addNote = async (): Promise<Note | null> => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('notes')
      .insert({
        title: 'Nouvelle note',
        content: '',
        tag: 'Personnel',
        color: '#FAF7F2',
        pinned: false,
        user_id: userId,
      })
      .select()
      .single();
    if (!error && data) {
      const note = data as Note;
      setNotes(prev => [note, ...prev]);
      return note;
    }
    return null;
  };

  const updateNote = (id: string, field: string, value: string) => {
    const now = new Date().toISOString();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: value, updated_at: now } : n));
    if (debounceRefs.current[id]) clearTimeout(debounceRefs.current[id]);
    debounceRefs.current[id] = setTimeout(async () => {
      await supabase
        .from('notes')
        .update({ [field]: value, updated_at: now })
        .eq('id', id);
    }, 800);
  };

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const pinned = !note.pinned;
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned } : n));
    await supabase.from('notes').update({ pinned }).eq('id', id);
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    await supabase.from('notes').delete().eq('id', id);
  };

  return { notes, loading, addNote, updateNote, togglePin, deleteNote };
}
