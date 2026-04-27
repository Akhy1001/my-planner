'use client';
import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface SubTask {
  id: string;
  label: string;
  done: boolean;
}

export interface PlayfulTodo {
  id: string;
  label: string;
  done: boolean;
  subtasks: SubTask[];
}

export interface DayStat {
  date: string;   // 'yyyy-MM-dd'
  label: string;  // 'Lu', 'Ma', …
  count: number;
}

const DAY_LABELS = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];

function buildEmptyWeek(): DayStat[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    return {
      date: format(d, 'yyyy-MM-dd'),
      label: DAY_LABELS[d.getDay()],
      count: 0,
    };
  });
}

export function usePlayfulTodos() {
  const [todos, setTodos] = useState<PlayfulTodo[]>([]);
  const [weekStats, setWeekStats] = useState<DayStat[]>(buildEmptyWeek());
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
        .select('id, label, done, playful_subtasks(id, label, done)')
        .eq('user_id', userId)
        .eq('done', false)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setTodos(data.map(row => ({
          ...row,
          subtasks: (row.playful_subtasks ?? []) as SubTask[],
        })));
      }
      setLoading(false);
    };

    const fetchStats = async () => {
      const since = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('playful_todos')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('done', true)
        .gte('completed_at', `${since}T00:00:00.000Z`);

      if (!error && data) {
        const week = buildEmptyWeek();
        for (const row of data) {
          if (!row.completed_at) continue;
          const day = format(new Date(row.completed_at), 'yyyy-MM-dd');
          const slot = week.find(s => s.date === day);
          if (slot) slot.count++;
        }
        setWeekStats(week);
      }
    };

    fetchTodos();
    fetchStats();
  }, [userId]);

  const addTodo = async (label: string) => {
    if (!userId) return;
    const optimisticId = `temp-${Date.now()}`;
    setTodos(prev => [{ id: optimisticId, label, done: false, subtasks: [] }, ...prev]);
    const { data, error } = await supabase
      .from('playful_todos')
      .insert({ label, done: false, user_id: userId })
      .select('id, label, done')
      .single();
    if (!error && data) {
      setTodos(prev => prev.map(t =>
        t.id === optimisticId ? { ...(data as Omit<PlayfulTodo, 'subtasks'>), subtasks: [] } : t
      ));
    } else {
      setTodos(prev => prev.filter(t => t.id !== optimisticId));
    }
  };

  const completeTodo = async (id: string) => {
    const completedAt = new Date().toISOString();
    setTodos(prev => prev.filter(t => t.id !== id));
    await supabase
      .from('playful_todos')
      .update({ done: true, completed_at: completedAt })
      .eq('id', id);
    const today = format(new Date(), 'yyyy-MM-dd');
    setWeekStats(prev => prev.map(s =>
      s.date === today ? { ...s, count: s.count + 1 } : s
    ));
  };

  const removeTodo = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    await supabase.from('playful_todos').delete().eq('id', id);
  };

  // ── Sous-tâches ──────────────────────────────────────────────────────────────

  const addSubtask = async (todoId: string, label: string) => {
    if (!userId) return;
    const optimisticId = `temp-sub-${Date.now()}`;
    setTodos(prev => prev.map(t =>
      t.id === todoId
        ? { ...t, subtasks: [...t.subtasks, { id: optimisticId, label, done: false }] }
        : t
    ));
    const { data, error } = await supabase
      .from('playful_subtasks')
      .insert({ label, done: false, todo_id: todoId, user_id: userId })
      .select('id, label, done')
      .single();
    if (!error && data) {
      setTodos(prev => prev.map(t =>
        t.id === todoId
          ? { ...t, subtasks: t.subtasks.map(s => s.id === optimisticId ? (data as SubTask) : s) }
          : t
      ));
    } else {
      setTodos(prev => prev.map(t =>
        t.id === todoId
          ? { ...t, subtasks: t.subtasks.filter(s => s.id !== optimisticId) }
          : t
      ));
    }
  };

  const toggleSubtask = async (todoId: string, subtaskId: string) => {
    const todo = todos.find(t => t.id === todoId);
    const sub = todo?.subtasks.find(s => s.id === subtaskId);
    if (!sub) return;
    const done = !sub.done;
    setTodos(prev => prev.map(t =>
      t.id === todoId
        ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, done } : s) }
        : t
    ));
    await supabase.from('playful_subtasks').update({ done }).eq('id', subtaskId);
  };

  const removeSubtask = async (todoId: string, subtaskId: string) => {
    setTodos(prev => prev.map(t =>
      t.id === todoId
        ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) }
        : t
    ));
    await supabase.from('playful_subtasks').delete().eq('id', subtaskId);
  };

  return { todos, loading, weekStats, addTodo, completeTodo, removeTodo, addSubtask, toggleSubtask, removeSubtask };
}
