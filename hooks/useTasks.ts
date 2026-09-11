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
  const [today, setToday] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [tasks, setTasks] = useState<Task[]>([]);
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
    const fetchTasks = async () => {
      // Charger les tâches d'aujourd'hui + les tâches antérieures non terminées (en retard)
      const [todayRes, overdueRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .order('created_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .lt('date', today)
          .eq('done', false)
          .order('date', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);

      const todayTasks = (!todayRes.error && todayRes.data) ? (todayRes.data as Task[]) : [];
      const overdueTasks = (!overdueRes.error && overdueRes.data) ? (overdueRes.data as Task[]) : [];

      // Mettre les tâches en retard en tête de liste
      const map = new Map<string, Task>();
      overdueTasks.forEach(t => map.set(t.id, t));
      todayTasks.forEach(t => map.set(t.id, t));
      setTasks(Array.from(map.values()));
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
    // Si la tâche était en retard et qu'on la coche, on la date à aujourd'hui pour qu'elle compte dans les accomplissements du jour
    const updatePayload: { done: boolean; date?: string } = { done };
    if (done && task.date < today) {
      updatePayload.date = today;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done, date: updatePayload.date ?? t.date } : t));
    await supabase.from('tasks').update(updatePayload).eq('id', id);
  };

  const removeTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const rescheduleTask = async (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, date: today } : t));
    await supabase.from('tasks').update({ date: today }).eq('id', id);
  };

  const rescheduleAllOverdue = async () => {
    const overdueIds = tasks.filter(t => !t.done && t.date < today).map(t => t.id);
    if (overdueIds.length === 0) return;
    setTasks(prev => prev.map(t => overdueIds.includes(t.id) ? { ...t, date: today } : t));
    await supabase.from('tasks').update({ date: today }).in('id', overdueIds);
  };

  return { tasks, loading, addTask, toggleTask, removeTask, rescheduleTask, rescheduleAllOverdue, today };
}
