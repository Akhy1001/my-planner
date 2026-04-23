'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface PlayfulTodo {
  id: string;
  label: string;
  done: boolean;
}

export function usePlayfulTodos() {
  const [todos, setTodos] = useState<PlayfulTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from('playful_todos')
        .select('id, label, done')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (!error && data) setTodos(data as PlayfulTodo[]);
      setLoading(false);
    };
    fetchTodos();
  }, [userId]);

  const addTodo = async (label: string) => {
    if (!userId) return;
    const optimisticId = `temp-${Date.now()}`;
    setTodos(prev => [{ id: optimisticId, label, done: false }, ...prev]);
    const { data, error } = await supabase
      .from('playful_todos')
      .insert({ label, done: false, user_id: userId })
      .select('id, label, done')
      .single();
    if (!error && data) {
      setTodos(prev => prev.map(t => t.id === optimisticId ? (data as PlayfulTodo) : t));
    } else {
      setTodos(prev => prev.filter(t => t.id !== optimisticId));
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const done = !todo.done;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done } : t));
    await supabase.from('playful_todos').update({ done }).eq('id', id);
  };

  const removeTodo = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    await supabase.from('playful_todos').delete().eq('id', id);
  };

  return { todos, loading, addTodo, toggleTodo, removeTodo };
}
