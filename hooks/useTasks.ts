'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export interface Subtask {
  id: string;
  task_id: string;
  text: string;
  done: boolean;
  created_at?: string;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  time?: string;
  date: string;
  subtasks: Subtask[];
}

type TaskRow = Omit<Task, 'subtasks'> & { task_subtasks?: Subtask[] | null };

const TASK_SELECT = '*, task_subtasks(id, task_id, text, done, created_at)';

function sortSubtasks(subtasks: Subtask[]): Subtask[] {
  return [...subtasks].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
}

function rowToTask({ task_subtasks, ...task }: TaskRow): Task {
  return { ...task, subtasks: sortSubtasks(task_subtasks ?? []) };
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
      const query = (select: string) => Promise.all([
        supabase
          .from('tasks')
          .select(select)
          .eq('user_id', userId)
          .eq('date', today)
          .order('created_at', { ascending: true }),
        supabase
          .from('tasks')
          .select(select)
          .eq('user_id', userId)
          .lt('date', today)
          .eq('done', false)
          .order('date', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);

      let [todayRes, overdueRes] = await query(TASK_SELECT);
      // Si la table task_subtasks est absente, on charge quand même les tâches (sans sous-tâches)
      if (todayRes.error || overdueRes.error) {
        console.error('Chargement des sous-tâches impossible :', (todayRes.error ?? overdueRes.error)?.message);
        [todayRes, overdueRes] = await query('*');
      }

      const todayTasks = (!todayRes.error && todayRes.data) ? (todayRes.data as unknown as TaskRow[]).map(rowToTask) : [];
      const overdueTasks = (!overdueRes.error && overdueRes.data) ? (overdueRes.data as unknown as TaskRow[]).map(rowToTask) : [];

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
    if (!error && data) setTasks(prev => [...prev, { ...(data as Omit<Task, 'subtasks'>), subtasks: [] }]);
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
    // Cocher la tâche parente coche aussi toutes ses sous-tâches
    const pendingSubtaskIds = done
      ? task.subtasks.filter(s => !s.done && !s.id.startsWith('temp-')).map(s => s.id)
      : [];
    setTasks(prev => prev.map(t => t.id === id
      ? {
          ...t,
          done,
          date: updatePayload.date ?? t.date,
          subtasks: done ? t.subtasks.map(s => ({ ...s, done: true })) : t.subtasks,
        }
      : t
    ));
    await Promise.all([
      supabase.from('tasks').update(updatePayload).eq('id', id),
      pendingSubtaskIds.length > 0
        ? supabase.from('task_subtasks').update({ done: true }).in('id', pendingSubtaskIds)
        : Promise.resolve(),
    ]);
  };

  const removeTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    // Les sous-tâches sont supprimées en cascade côté base
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

  // ── Sous-tâches ──────────────────────────────────────────────────────────────

  const updateSubtasks = (taskId: string, updater: (subtasks: Subtask[]) => Subtask[]) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: updater(t.subtasks) } : t));
  };

  const addSubtask = async (taskId: string, text: string) => {
    const trimmed = text.trim();
    if (!userId || !trimmed) return;
    const optimisticId = `temp-sub-${Date.now()}`;
    updateSubtasks(taskId, subs => [...subs, { id: optimisticId, task_id: taskId, text: trimmed, done: false }]);
    const { data, error } = await supabase
      .from('task_subtasks')
      .insert({ text: trimmed, done: false, task_id: taskId, user_id: userId })
      .select('id, task_id, text, done, created_at')
      .single();
    if (!error && data) {
      updateSubtasks(taskId, subs => subs.map(s => s.id === optimisticId ? (data as Subtask) : s));
    } else {
      console.error('Ajout de la sous-tâche impossible :', error?.message);
      updateSubtasks(taskId, subs => subs.filter(s => s.id !== optimisticId));
    }
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    if (subtaskId.startsWith('temp-')) return;
    const sub = tasks.find(t => t.id === taskId)?.subtasks.find(s => s.id === subtaskId);
    if (!sub) return;
    const done = !sub.done;
    updateSubtasks(taskId, subs => subs.map(s => s.id === subtaskId ? { ...s, done } : s));
    const { error } = await supabase.from('task_subtasks').update({ done }).eq('id', subtaskId);
    if (error) {
      updateSubtasks(taskId, subs => subs.map(s => s.id === subtaskId ? { ...s, done: !done } : s));
    }
  };

  const removeSubtask = async (taskId: string, subtaskId: string) => {
    if (subtaskId.startsWith('temp-')) return;
    const previous = tasks.find(t => t.id === taskId)?.subtasks;
    updateSubtasks(taskId, subs => subs.filter(s => s.id !== subtaskId));
    const { error } = await supabase.from('task_subtasks').delete().eq('id', subtaskId);
    if (error && previous) {
      updateSubtasks(taskId, () => previous);
    }
  };

  return {
    tasks,
    loading,
    addTask,
    toggleTask,
    removeTask,
    rescheduleTask,
    rescheduleAllOverdue,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    today,
  };
}
