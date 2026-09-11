'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Trash, CheckCircle, Edit, ScribbleStrikethrough, TextReveal } from './animate-ui';
import AddButton from './AddButton';
import { useTasks, Task } from '@/hooks/useTasks';
import { useJournal } from '@/hooks/useJournal';
import { useAuth } from '@/hooks/useAuth';
import { 
  Sparkles, 
  Check, 
  Droplets, 
  BookOpen, 
  Calendar,
  CheckCircle2,
  Clock,
  Tag,
  ListFilter,
  Zap,
  Heart,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

type Priority = 'high' | 'medium' | 'low';
type FilterTab = 'all' | 'todo' | 'urgent' | 'overdue' | 'done';

function getOverdueLabel(taskDate: string, todayStr: string): string {
  try {
    const d = new Date(taskDate + 'T00:00:00');
    const today = new Date(todayStr + 'T00:00:00');
    const diffDays = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return format(d, 'd MMM', { locale: fr });
  } catch {
    return 'En retard';
  }
}

const CATEGORIES = ['Personnel', 'Travail', 'Projet', 'Santé', 'Loisirs', 'Études'] as const;

export default function TodayView() {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, addTask, toggleTask, removeTask, rescheduleTask, rescheduleAllOverdue, today } = useTasks();
  const { journal, loading: journalLoading, updateJournal } = useJournal();

  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newCategory, setNewCategory] = useState<string>('Personnel');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const email = user?.email?.toLowerCase().trim();
  const isRose = email?.startsWith('rstrpn05@');
  const displayName = email?.startsWith('anas.fz1001@')
    ? 'Anas'
    : isRose
    ? 'Rose'
    : (() => {
        const rawName = user?.email?.split('@')[0] ?? 'Utilisateur';
        return rawName.charAt(0).toUpperCase() + rawName.slice(1);
      })();

  const currentHour = new Date().getHours();
  const greeting = currentHour >= 18 ? 'Bonsoir' : currentHour >= 12 ? 'Bel après-midi' : 'Bonjour';

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addTask({ text: newTask.trim(), priority: newPriority, category: newCategory });
    setNewTask('');
  };

  const priorityConfig = {
    high: { label: 'Haute', bg: 'var(--priority-high)', bgLight: 'var(--priority-high-bg)', color: 'var(--priority-high)', fontWeight: '700' },
    medium: { label: 'Moyenne', bg: 'var(--priority-medium)', bgLight: 'var(--priority-medium-bg)', color: 'var(--priority-medium)', fontWeight: '600' },
    low: { label: 'Basse', bg: 'var(--priority-low)', bgLight: 'var(--priority-low-bg)', color: 'var(--priority-low)', fontWeight: '600' },
  } as const;

  const doneTasks = tasks.filter(t => t.done).length;
  const todoTasks = tasks.filter(t => !t.done).length;
  const urgentTasks = tasks.filter(t => !t.done && t.priority === 'high').length;
  const overdueTasks = tasks.filter(t => !t.done && t.date < today).length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case 'todo':
        return tasks.filter(t => !t.done);
      case 'urgent':
        return tasks.filter(t => !t.done && t.priority === 'high');
      case 'overdue':
        return tasks.filter(t => !t.done && t.date < today);
      case 'done':
        return tasks.filter(t => t.done);
      case 'all':
      default:
        return tasks;
    }
  }, [tasks, activeFilter, today]);

  const loading = tasksLoading || journalLoading;

  return (
    <div className="today-view-container">
      
      {/* ── 1. HEADER BENTO & ANNEAU CIRCULAIRE APPLE WATCH STYLE ── */}
      <motion.div
        className="today-header-bento"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Titre & Date */}
        <div>
          <TextReveal
            delay={0.02}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: 'var(--stone)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            <Calendar size={13} style={{ color: 'var(--stone)' }} />
            <span>{format(new Date(), 'eeee d MMMM yyyy', { locale: fr })}</span>
          </TextReveal>

          <TextReveal
            as="h1"
            key={`${greeting}-${displayName}`}
            delay={0.06}
            className="font-display"
            style={{
              fontSize: '2.15rem',
              fontWeight: 800,
              color: 'var(--ink)',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span>{greeting}, {displayName}</span>
            {isRose ? (
              <motion.div
                animate={{
                  scale: [1, 1.15, 1, 1.1, 1],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <Heart
                  size={26}
                  style={{
                    color: 'var(--accent, #D4607E)',
                    fill: 'var(--accent, #D4607E)',
                    display: 'inline-block',
                    filter: 'drop-shadow(0 2px 8px rgba(212, 96, 126, 0.35))',
                  }}
                />
              </motion.div>
            ) : (
              <motion.span
                animate={{
                  scale: [1, 1.25, 0.96, 1.18, 1],
                  rotate: [0, 14, -8, 12, 0],
                  filter: [
                    'drop-shadow(0 0 0px rgba(0, 0, 0, 0))',
                    'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.22))',
                    'drop-shadow(0 0 1px rgba(0, 0, 0, 0.08))',
                    'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.18))',
                    'drop-shadow(0 0 0px rgba(0, 0, 0, 0))',
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{
                  scale: 1.4,
                  rotate: 180,
                  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                }}
                whileTap={{ scale: 0.85 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink, #000000)',
                  cursor: 'pointer',
                  fontSize: '1.75rem',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                ✦
              </motion.span>
            )}
          </TextReveal>

          <TextReveal
            delay={0.12}
            style={{ fontSize: '0.84rem', color: 'var(--stone)', marginTop: '4px', fontWeight: 500 }}
          >
            {loading ? (
              <span className="skeleton" style={{ display: 'inline-block', width: '180px', height: '16px' }} />
            ) : tasks.length === 0 ? (
              'Prêt pour une journée sereine ? Ajoutez vos premières priorités.'
            ) : (
              `${tasks.length} tâche${tasks.length > 1 ? 's' : ''} au programme · ${doneTasks} terminée${doneTasks > 1 ? 's' : ''} (${todoTasks} restante${todoTasks > 1 ? 's' : ''})`
            )}
          </TextReveal>
        </div>

        {/* Apple Watch Progress Ring Card */}
        <motion.div
          className="today-progress-card"
          whileHover={{
            y: -2,
            boxShadow: progress === 100
              ? '0 10px 28px -4px rgba(16, 185, 129, 0.25)'
              : progress >= 50
              ? '0 10px 28px -4px rgba(59, 130, 246, 0.22)'
              : '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
          }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--card, #FFFFFF)',
            border: progress === 100
              ? '1.5px solid rgba(16, 185, 129, 0.4)'
              : progress >= 50
              ? '1.5px solid rgba(59, 130, 246, 0.35)'
              : '1px solid var(--border)',
            borderRadius: '20px',
            padding: '12px 18px',
            minWidth: '240px',
            boxShadow: progress === 100
              ? '0 6px 24px -2px rgba(16, 185, 129, 0.18), 0 2px 10px rgba(15, 23, 42, 0.04)'
              : progress >= 50
              ? '0 6px 22px -2px rgba(59, 130, 246, 0.14), 0 2px 10px rgba(15, 23, 42, 0.04)'
              : '0 2px 10px rgba(15, 23, 42, 0.04)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Calque de fond de célébration émeraude à 100% */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(16, 185, 129, 0.12) 100%)',
              opacity: progress === 100 ? 1 : 0,
              transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'none',
              borderRadius: '20px',
            }}
          />

          {/* Calque de fond dynamique cobalt/azur dès 50% */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(59, 130, 246, 0.09) 100%)',
              opacity: progress >= 50 && progress < 100 ? 1 : 0,
              transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'none',
              borderRadius: '20px',
            }}
          />

          {/* Faisceau lumineux glissant (sheen sweep) à 100% */}
          {progress === 100 && (
            <motion.div
              initial={{ x: '-150%', opacity: 0.6 }}
              animate={{ x: '250%', opacity: 0 }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], repeat: Infinity, repeatDelay: 6 }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '60%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Circular SVG Ring */}
          <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
            <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="28"
                cy="28"
                r="23"
                fill="none"
                stroke="var(--border)"
                strokeWidth="4.5"
              />
              <motion.circle
                cx="28"
                cy="28"
                r="23"
                fill="none"
                stroke={progress === 100 ? '#10B981' : progress >= 50 ? '#3B82F6' : 'var(--accent, #3B82F6)'}
                strokeWidth="4.5"
                strokeDasharray={2 * Math.PI * 23}
                initial={{ strokeDashoffset: 2 * Math.PI * 23 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 23 * (1 - progress / 100) }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                strokeLinecap="round"
                style={{
                  filter: progress === 100
                    ? 'drop-shadow(0 0 5px rgba(16, 185, 129, 0.4))'
                    : progress >= 50
                    ? 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.35))'
                    : 'none',
                  transition: 'filter 0.5s ease',
                }}
              />
            </svg>
            <span
              style={{
                position: 'absolute',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: progress === 100 ? '#10B981' : progress >= 50 ? '#2563EB' : 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 0.4s ease',
              }}
            >
              {progress}%
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--stone)' }}>
              Progression
            </div>

            {/* Animation de glissement vertical fluide (Slot Machine Slide) */}
            <div style={{ position: 'relative', height: '26px', overflow: 'hidden', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
              <AnimatePresence mode="wait" initial={false}>
                {progress === 100 ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 16, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -16, filter: 'blur(3px)' }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 9px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#059669',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      <Sparkles size={12} style={{ color: '#10B981' }} />
                      <span>Journée accomplie ✦</span>
                    </span>
                  </motion.div>
                ) : progress >= 50 ? (
                  <motion.div
                    key="optimal"
                    initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 9px',
                        borderRadius: '8px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.28)',
                        color: '#2563EB',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.12)',
                      }}
                    >
                      <Zap size={12} style={{ color: '#3B82F6', fill: '#3B82F6' }} />
                      <span>Rythme optimal</span>
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 9px',
                        borderRadius: '8px',
                        background: 'rgba(100, 116, 139, 0.08)',
                        border: '1px solid rgba(100, 116, 139, 0.18)',
                        color: 'var(--stone)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Clock size={11} style={{ color: 'var(--stone)' }} />
                      <span>Session active</span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── 2. GRILLE BENTO (COLONNE GAUCHE TÂCHES + COLONNE DROITE WIDGETS) ── */}
      <div className="today-bento-grid">
        
        {/* ── COLONNE GAUCHE (TÂCHES & QUICK ADD) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          
          {/* ── BLOC UNIQUE : TÂCHES DU JOUR (AJOUT + FILTRES + LISTE) ── */}
          <motion.div
            layout
            style={{
              background: 'var(--card, #FFFFFF)',
              borderRadius: '20px',
              padding: '24px',
              border: progress === 100 && tasks.length > 0
                ? '1px solid rgba(16, 185, 129, 0.28)'
                : progress >= 50 && tasks.length > 0
                ? '1px solid rgba(59, 130, 246, 0.24)'
                : '1px solid var(--border)',
              boxShadow: progress === 100 && tasks.length > 0
                ? '0 6px 24px -4px rgba(16, 185, 129, 0.09), 0 2px 10px rgba(15, 23, 42, 0.03)'
                : progress >= 50 && tasks.length > 0
                ? '0 6px 22px -4px rgba(59, 130, 246, 0.07), 0 2px 10px rgba(15, 23, 42, 0.03)'
                : '0 2px 10px rgba(15, 23, 42, 0.03)',
              transition: 'border-color 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Header du bloc Tâches */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3B82F6',
                }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)' }}>
                    Tâches du jour
                  </h2>
                  <div style={{ fontSize: '0.74rem', color: 'var(--stone)' }}>
                    {todoTasks} restante{todoTasks > 1 ? 's' : ''} · {doneTasks} terminée{doneTasks > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {doneTasks > 0 && activeFilter === 'all' && (
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: progress === 100
                    ? 'rgba(16, 185, 129, 0.1)'
                    : progress >= 50
                    ? 'rgba(59, 130, 246, 0.08)'
                    : 'rgba(100, 116, 139, 0.08)',
                  border: progress === 100
                    ? '1px solid rgba(16, 185, 129, 0.22)'
                    : progress >= 50
                    ? '1px solid rgba(59, 130, 246, 0.2)'
                    : '1px solid var(--border)',
                  color: progress === 100
                    ? '#059669'
                    : progress >= 50
                    ? '#2563EB'
                    : 'var(--stone)',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}>
                  {progress === 100 ? (
                    <>
                      <Sparkles size={12} style={{ color: '#10B981' }} />
                      <span>{doneTasks}/{tasks.length} terminées</span>
                    </>
                  ) : progress >= 50 ? (
                    <>
                      <Zap size={12} style={{ color: '#3B82F6', fill: '#3B82F6' }} />
                      <span>{doneTasks}/{tasks.length} validées</span>
                    </>
                  ) : (
                    <span>✦ {doneTasks}/{tasks.length} validées</span>
                  )}
                </div>
              )}
            </div>
            {/* Input Row */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
              <div
                className="task-input-bar"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--muted, #F8FAFC)',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  padding: '4px 12px',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                  placeholder="Ajouter une tâche… (Appuyez sur Entrée)"
                  className="clean-task-input"
                  style={{
                    width: '100%',
                    padding: '8px 4px',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    background: 'transparent',
                    backgroundColor: 'transparent',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    fontSize: '0.88rem',
                    color: 'var(--ink)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <AddButton onClick={handleAddTask} />
            </div>

            {/* Chips Row: Priorités & Catégories */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border)',
            }}>
              {/* Priorité Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--stone)', marginRight: '2px' }}>
                  Priorité :
                </span>
                {(['high', 'medium', 'low'] as const).map(p => {
                  const isSelected = newPriority === p;
                  const cfg = priorityConfig[p];
                  return (
                    <motion.button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ scale: 1.03 }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: isSelected ? `1.5px solid ${cfg.bg}` : '1px solid var(--border)',
                        background: isSelected ? cfg.bgLight : 'transparent',
                        color: isSelected ? cfg.color : 'var(--stone)',
                        fontSize: '0.74rem',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {cfg.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Catégories Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', maxWidth: '100%' }}>
                <Tag size={12} style={{ color: 'var(--stone)', flexShrink: 0 }} />
                {CATEGORIES.map(cat => {
                  const isSelected = newCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setNewCategory(cat)}
                      style={{
                        padding: '3px 9px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--ink)' : 'var(--border)',
                        background: isSelected ? 'var(--ink)' : 'transparent',
                        color: isSelected ? 'var(--cream, #FFFFFF)' : 'var(--stone)',
                        fontSize: '0.72rem',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Pills Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              paddingTop: '12px',
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ListFilter size={13} style={{ color: 'var(--stone)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--stone)' }}>Filtrer :</span>
                
                <button
                  onClick={() => setActiveFilter('all')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeFilter === 'all' ? 'var(--ink)' : 'var(--muted)',
                    color: activeFilter === 'all' ? 'var(--cream, #FFFFFF)' : 'var(--stone)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  Toutes ({tasks.length})
                </button>

                <button
                  onClick={() => setActiveFilter('todo')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeFilter === 'todo' ? 'var(--ink)' : 'var(--muted)',
                    color: activeFilter === 'todo' ? 'var(--cream, #FFFFFF)' : 'var(--stone)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  À faire ({todoTasks})
                </button>

                {overdueTasks > 0 && (
                  <button
                    onClick={() => setActiveFilter('overdue')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeFilter === 'overdue' ? '#EF4444' : 'rgba(239, 68, 68, 0.12)',
                      color: activeFilter === 'overdue' ? '#FFFFFF' : '#EF4444',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <AlertCircle size={12} />
                    En retard ({overdueTasks})
                  </button>
                )}

                <button
                  onClick={() => setActiveFilter('urgent')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeFilter === 'urgent' ? 'var(--priority-high-bg)' : 'var(--muted)',
                    color: activeFilter === 'urgent' ? 'var(--priority-high)' : 'var(--stone)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  Urgentes ({urgentTasks})
                </button>

                <button
                  onClick={() => setActiveFilter('done')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeFilter === 'done' ? 'var(--ink)' : 'var(--muted)',
                    color: activeFilter === 'done' ? 'var(--cream, #FFFFFF)' : 'var(--stone)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  Terminées ({doneTasks})
                </button>
              </div>
            </div>

            {/* Séparateur interne et liste des tâches */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '14px' }}>
            {/* Bannière d'alerte pour les tâches en retard */}
            {overdueTasks > 0 && activeFilter !== 'overdue' && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.22)',
                  marginBottom: '14px',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#EF4444', fontWeight: 600 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>
                    {overdueTasks} tâche{overdueTasks > 1 ? 's' : ''} en retard des jours précédents
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <motion.button
                    onClick={() => rescheduleAllOverdue()}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.14)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.28)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: 'inherit',
                    }}
                  >
                    <RotateCcw size={11} />
                    Tout reporter à aujourd&apos;hui
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveFilter('overdue')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      background: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Voir
                  </motion.button>
                </div>
              </motion.div>
            )}

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="skeleton" style={{ height: '54px', borderRadius: '14px' }} />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--stone)',
                }}>
                  <CheckCircle2 size={22} />
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)' }}>
                  {activeFilter === 'done'
                    ? 'Aucune tâche terminée pour l\'instant'
                    : activeFilter === 'urgent'
                    ? 'Aucune tâche urgente, tout est sous contrôle !'
                    : activeFilter === 'overdue'
                    ? 'Aucune tâche en retard, vous êtes à jour ! 🎉'
                    : activeFilter === 'todo'
                    ? 'Toutes les tâches sont terminées ! Bravo 🎉'
                    : 'Aucune tâche enregistrée aujourd\'hui'}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--stone)', maxWidth: '280px' }}>
                  Utilisez la barre au-dessus pour ajouter vos objectifs et priorités.
                </p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task, i) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        backgroundColor: task.done ? 'var(--muted)' : 'transparent',
                      }}
                      exit={{
                        opacity: 0,
                        x: -20,
                        scale: 0.95,
                        transition: { duration: 0.18 },
                      }}
                      transition={{
                        duration: 0.28,
                        delay: Math.min(i * 0.04, 0.2),
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileHover={{
                        y: -1,
                        backgroundColor: task.done ? 'var(--muted)' : 'rgba(15, 23, 42, 0.02)',
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '16px',
                        border: task.done ? '1px solid var(--border)' : '1px solid transparent',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      {/* Checkbox Tactile */}
                      <motion.button
                        onClick={() => toggleTask(task.id)}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.08 }}
                        aria-label={task.done ? 'Marquer comme à faire' : 'Marquer comme terminée'}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '8px',
                          border: task.done ? 'none' : '1.8px solid var(--stone-light, #CBD5E1)',
                          background: task.done ? 'var(--ink)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.18s ease',
                        }}
                      >
                        {task.done && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </motion.button>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: task.done ? 500 : 600,
                            color: task.done ? 'var(--stone)' : 'var(--ink)',
                            textDecoration: task.done ? 'line-through' : 'none',
                            transition: 'color 0.2s, opacity 0.2s',
                            opacity: task.done ? 0.6 : 1,
                            wordBreak: 'break-word',
                          }}
                        >
                          {task.text}
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Badge En retard */}
                          {task.date < today && !task.done && (
                            <span
                              style={{
                                fontSize: '0.66rem',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'rgba(239, 68, 68, 0.14)',
                                color: '#EF4444',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <AlertCircle size={11} />
                              En retard ({getOverdueLabel(task.date, today)})
                            </span>
                          )}

                          {task.time && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: 'var(--stone)' }}>
                              <Clock size={11} /> {task.time}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 7px',
                              borderRadius: '6px',
                              background: 'var(--card)',
                              color: 'var(--stone)',
                              border: '1px solid var(--border)',
                              fontWeight: 600,
                            }}
                          >
                            {task.category}
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 8px',
                              borderRadius: '999px',
                              background: priorityConfig[task.priority].bgLight,
                              color: priorityConfig[task.priority].color,
                              fontWeight: priorityConfig[task.priority].fontWeight,
                              border: `1px solid ${priorityConfig[task.priority].bg}`,
                              opacity: task.done ? 0.45 : 1,
                            }}
                          >
                            {priorityConfig[task.priority].label}
                          </span>
                        </div>
                      </div>

                      {/* Action Reporter si en retard */}
                      {task.date < today && !task.done && (
                        <motion.button
                          onClick={() => rescheduleTask(task.id)}
                          title="Reporter la tâche à aujourd'hui"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            cursor: 'pointer',
                            padding: '4px 9px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#EF4444',
                            fontFamily: 'inherit',
                            flexShrink: 0,
                          }}
                        >
                          <RotateCcw size={11} />
                          Reporter
                        </motion.button>
                      )}

                      {/* Delete Action */}
                      <motion.button
                        onClick={() => removeTask(task.id)}
                        title="Supprimer la tâche"
                        whileHover={{ scale: 1.15, background: 'var(--priority-high-bg)' }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.4,
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
                      >
                        <Trash size={15} color="var(--priority-high)" />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            </div>
          </motion.div>
        </div>

        {/* ── COLONNE DROITE (WIDGETS BENTO BIEN-ÊTRE & FOCUS) ── */}
        <div className="today-widgets-column">
          
          {/* Bento Widget 1: Hydratation */}
          <div
            style={{
              background: 'var(--card, #FFFFFF)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
            }}
          >
            <WaterBentoWidget
              glasses={journal.water_glasses}
              target={journal.water_target}
              onChange={(glasses) => updateJournal({ water_glasses: glasses })}
              onTargetChange={(target) => updateJournal({ water_target: target })}
            />
          </div>

          {/* Bento Widget 2: Lecture */}
          <div
            style={{
              background: 'var(--card, #FFFFFF)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
            }}
          >
            <ReadingBentoWidget
              chapters={journal.reading_chapters}
              target={journal.reading_target}
              onChaptersChange={(chapters) => updateJournal({ reading_chapters: chapters })}
              onTargetChange={(target) => updateJournal({ reading_target: target })}
            />
          </div>

          {/* Bento Widget 3: Daily Focus & Intention */}
          <DailyFocusCard />

        </div>

      </div>

    </div>
  );
}

// ─── BENTO WIDGET HYDRATATION ───────────────────────────────────────────────────

function WaterBentoWidget({
  glasses,
  target,
  onChange,
  onTargetChange,
}: {
  glasses: number;
  target: number;
  onChange: (n: number) => void;
  onTargetChange: (n: number) => void;
}) {
  const [editingTarget, setEditingTarget] = useState(false);
  const [draftTarget, setDraftTarget] = useState(String(target));

  const confirmTarget = () => {
    const parsed = parseInt(draftTarget, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) {
      onTargetChange(parsed);
    } else {
      setDraftTarget(String(target));
    }
    setEditingTarget(false);
  };

  const percentage = Math.min(Math.round((glasses / target) * 100), 100);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3B82F6',
          }}>
            <Droplets size={16} />
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--ink)' }}>
              Hydratation
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>
              {glasses} sur {target} gourdes
            </div>
          </div>
        </div>

        <motion.button
          onClick={() => { setDraftTarget(String(target)); setEditingTarget(v => !v); }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            opacity: editingTarget ? 1 : 0.45,
          }}
          aria-label="Modifier l'objectif d'hydratation"
        >
          <Edit size={14} color="var(--stone)" />
        </motion.button>
      </div>

      {/* Target input when editing */}
      <AnimatePresence>
        {editingTarget && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: '12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--stone)' }}>Objectif :</span>
              <input
                type="number"
                min={1}
                max={20}
                value={draftTarget}
                onChange={e => setDraftTarget(e.target.value)}
                onBlur={confirmTarget}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmTarget();
                  if (e.key === 'Escape') { setDraftTarget(String(target)); setEditingTarget(false); }
                }}
                autoFocus
                style={{
                  width: '54px',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid #3B82F6',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  fontSize: '0.78rem',
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>(Entrée pour valider)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jauge Fluide */}
      <div style={{ width: '100%', height: '8px', background: 'var(--muted)', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
        <motion.div
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%)',
            borderRadius: '999px',
          }}
        />
      </div>

      {/* Interactive Controls & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: glasses >= target ? 'var(--sage, #10B981)' : 'var(--stone)' }}>
          {glasses >= target ? '✓ Objectif atteint !' : `Encore ${target - glasses} à boire`}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <motion.button
            onClick={() => onChange(Math.max(0, glasses - 1))}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.06 }}
            disabled={glasses === 0}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--ink)',
              cursor: glasses === 0 ? 'not-allowed' : 'pointer',
              opacity: glasses === 0 ? 0.3 : 1,
              fontWeight: 800,
              fontSize: '0.85rem',
            }}
          >
            -
          </motion.button>
          <motion.button
            onClick={() => onChange(glasses + 1)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.06 }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              border: 'none',
              background: '#3B82F6',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
            }}
          >
            +
          </motion.button>
        </div>
      </div>
    </>
  );
}

// ─── BENTO WIDGET LECTURE ───────────────────────────────────────────────────────

function ReadingBentoWidget({
  chapters,
  target,
  onChaptersChange,
  onTargetChange,
}: {
  chapters: number;
  target: number;
  onChaptersChange: (n: number) => void;
  onTargetChange: (n: number) => void;
}) {
  const [editingTarget, setEditingTarget] = useState(false);
  const [draftTarget, setDraftTarget] = useState(String(target));

  const confirmTarget = () => {
    const parsed = parseInt(draftTarget, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      onTargetChange(parsed);
    } else {
      setDraftTarget(String(target));
    }
    setEditingTarget(false);
  };

  const percentage = Math.min(Math.round((chapters / target) * 100), 100);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'rgba(249, 115, 22, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F97316',
          }}>
            <BookOpen size={16} />
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--ink)' }}>
              Lecture
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>
              {chapters} sur {target} chapitres
            </div>
          </div>
        </div>

        <motion.button
          onClick={() => { setDraftTarget(String(target)); setEditingTarget(v => !v); }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            opacity: editingTarget ? 1 : 0.45,
          }}
          aria-label="Modifier l'objectif de lecture"
        >
          <Edit size={14} color="var(--stone)" />
        </motion.button>
      </div>

      {/* Target input when editing */}
      <AnimatePresence>
        {editingTarget && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: '12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--stone)' }}>Objectif :</span>
              <input
                type="number"
                min={1}
                max={100}
                value={draftTarget}
                onChange={e => setDraftTarget(e.target.value)}
                onBlur={confirmTarget}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirmTarget();
                  if (e.key === 'Escape') { setDraftTarget(String(target)); setEditingTarget(false); }
                }}
                autoFocus
                style={{
                  width: '54px',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid #F97316',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  fontSize: '0.78rem',
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>(Entrée pour valider)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jauge Dorée */}
      <div style={{ width: '100%', height: '8px', background: 'var(--muted)', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
        <motion.div
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #FDBA74 0%, #F97316 100%)',
            borderRadius: '999px',
          }}
        />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: chapters >= target ? 'var(--gold, #F97316)' : 'var(--stone)' }}>
          {chapters >= target ? '✓ Objectif validé !' : `${percentage}% accompli`}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <motion.button
            onClick={() => onChaptersChange(Math.max(0, chapters - 1))}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.06 }}
            disabled={chapters === 0}
            style={{
              padding: '3px 8px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--ink)',
              cursor: chapters === 0 ? 'not-allowed' : 'pointer',
              opacity: chapters === 0 ? 0.3 : 1,
              fontWeight: 700,
              fontSize: '0.74rem',
            }}
          >
            -1
          </motion.button>
          <motion.button
            onClick={() => onChaptersChange(chapters + 1)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.06 }}
            style={{
              padding: '3px 8px',
              borderRadius: '8px',
              border: 'none',
              background: '#F97316',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.74rem',
              boxShadow: '0 2px 6px rgba(249, 115, 22, 0.25)',
            }}
          >
            +1
          </motion.button>
        </div>
      </div>
    </>
  );
}

// ─── BENTO WIDGET FOCUS / INTENTION DU JOUR ────────────────────────────────────

function DailyFocusCard() {
  const [focusText, setFocusText] = useState<string>('Focaliser sur le progrès régulier plutôt que sur la perfection.');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('my_planner_daily_focus');
      if (saved) setFocusText(saved);
    } catch {}
  }, []);

  const saveFocus = (val: string) => {
    setFocusText(val);
    try {
      localStorage.setItem('my_planner_daily_focus', val);
    } catch {}
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        color: '#FFFFFF',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.16)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#60A5FA" />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93C5FD' }}>
            Intention du Jour
          </span>
        </div>
        <button
          onClick={() => setIsEditing(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Modifier l'intention du jour"
        >
          <Edit size={13} />
        </button>
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={focusText}
            onChange={e => saveFocus(e.target.value)}
            onBlur={() => setIsEditing(false)}
            rows={2}
            autoFocus
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '8px',
              color: '#FFFFFF',
              fontSize: '0.82rem',
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'none',
            }}
          />
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '4px' }}>
            Cliquez en dehors pour enregistrer
          </div>
        </div>
      ) : (
        <p
          onClick={() => setIsEditing(true)}
          style={{
            fontSize: '0.84rem',
            lineHeight: 1.45,
            fontWeight: 500,
            color: '#F1F5F9',
            fontStyle: 'italic',
            cursor: 'pointer',
          }}
          title="Cliquez pour personnaliser votre intention"
        >
          « {focusText} »
        </p>
      )}
    </motion.div>
  );
}
