'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  time?: string;
  date: string;
}

export function useTasks() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .order('created_at', { ascending: true });
      if (!error && data) setTasks(data as Task[]);
      setLoading(false);
    };
    fetchTasks();
  }, [userId, today]);

  const addTask = async (task: { text: string; priority: 'high' | 'medium' | 'low'; category: string; time?: string }) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, done: false, date: today, user_id: userId })
      .select()
      .single();
    if (!error && data) setTasks(prev => [...prev, data as Task]);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const done = !task.done;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done } : t));
    await supabase.from('tasks').update({ done }).eq('id', id);
  };

  const removeTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  return { tasks, loading, addTask, toggleTask, removeTask };
}
