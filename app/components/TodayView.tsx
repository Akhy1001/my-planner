'use client';
import AddButton from './AddButton';
import { Trash, Flag, PlayfulTodolist, CheckCircle } from './animate-ui';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTasks } from '@/hooks/useTasks';
import { useJournal } from '@/hooks/useJournal';

export default function TodayView() {
  const { tasks, loading: tasksLoading, addTask, toggleTask, removeTask } = useTasks();
  const { journal, loading: journalLoading, updateJournal } = useJournal();
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newCategory, setNewCategory] = useState('Personnel');

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addTask({ text: newTask, priority: newPriority, category: newCategory });
    setNewTask('');
  };

  const doneTasks = tasks.filter(t => t.done).length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const loading = tasksLoading || journalLoading;

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '32px', height: '100%', overflowY: 'auto' }}>
      {/* Left column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }} className="animate-fade-in">
          <div style={{ fontSize: '0.75rem', color: 'var(--stone)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
            {format(new Date(), 'eeee d MMMM yyyy', { locale: fr })}
          </div>
          <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: '500', color: 'var(--ink)', lineHeight: 1.2 }}>
            Bonjour ✦
          </h1>
        </div>

        {/* Progress */}
        <div style={{ 
          background: 'var(--warm-white)', borderRadius: '14px', 
          padding: '20px', marginBottom: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 8px rgba(26,23,20,0.04)'
        }} className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--stone)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Progression du jour</span>
            <motion.span
              key={progress}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="font-display"
              style={{ fontSize: '1.4rem', color: 'var(--ink)' }}
            >
              {progress}%
            </motion.span>
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              className={progress === 100 ? 'progress-bar-complete' : ''}
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--sage), var(--sage-light))',
                borderRadius: '3px',
                transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--stone)', marginTop: '8px' }}>
            {loading ? <span className="skeleton" style={{ display: 'inline-block', width: '160px', height: '14px' }} /> : `${doneTasks} tâche${doneTasks !== 1 ? 's' : ''} complétée${doneTasks !== 1 ? 's' : ''} sur ${tasks.length}`}
          </div>
        </div>

        {/* Tasks */}
        <div style={{ 
          background: 'var(--warm-white)', borderRadius: '14px', 
          padding: '20px', marginBottom: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 8px rgba(26,23,20,0.04)'
        }}>
          <h2 className="font-display" style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--ink)' }}>
            Tâches du jour
          </h2>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="skeleton" style={{ height: '52px', borderRadius: '14px', animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  className={`animate-slide-in task-row ${task.done ? 'task-done' : ''}`}
                  layout
                  initial={false}
                  animate={task.done ? { backgroundColor: 'rgba(192, 99, 74, 0.15)', scale: 1.02, x: [0, -6, 0] } : { backgroundColor: 'transparent', scale: 1, x: 0 }}
                  transition={{ duration: 0.28, type: 'tween', ease: 'easeOut' }}
                  whileHover={task.done ? {} : { y: -1 }}
                  style={{ 
                    animationDelay: `${i * 0.05}s`,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: task.done ? '1px solid rgba(192, 99, 74, 0.24)' : '1px solid transparent',
                  }}>
                  <motion.div
                    className={`task-check ${task.done ? 'checked' : ''}`}
                    onClick={() => toggleTask(task.id)}
                    whileTap={{ scale: 0.92 }}
                    animate={task.done ? { scale: [1, 1.18, 1], backgroundColor: 'var(--terra)' } : { scale: 1, backgroundColor: 'transparent' }}
                    transition={{ duration: 0.24, type: 'tween', ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      width: '26px', height: '26px', borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', border: '1px solid var(--border)',
                      background: task.done ? 'var(--terra)' : 'transparent',
                      color: task.done ? 'white' : 'var(--ink)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <AnimatePresence>
                      {task.done && (
                        <motion.span
                          key="check-pulse"
                          className="task-check-pulse"
                          initial={{ opacity: 0.38, scale: 0.8 }}
                          animate={{ opacity: [0.38, 0], scale: [1, 1.8] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        />
                      )}
                    </AnimatePresence>
                    {task.done && (
                      <motion.svg
                        width="12"
                        height="10"
                        viewBox="0 0 12 10"
                        fill="none"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    )}
                  </motion.div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={task.done ? 'task-text-done' : ''} style={{ 
                      fontSize: '0.85rem', color: task.done ? 'var(--stone)' : 'var(--ink)',
                      transition: 'all 0.2s',
                      opacity: task.done ? 0.78 : 1,
                    }}>
                      {task.text}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '3px', alignItems: 'center' }}>
                      {task.time && <span style={{ fontSize: '0.7rem', color: 'var(--stone)' }}>⏱ {task.time}</span>}
                      <span style={{ 
                        fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px',
                        background: 'var(--warm-white)', color: 'var(--stone)',
                        border: '1px solid var(--border)'
                      }}>{task.category}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {task.priority === 'high' && <Flag size={14} color="var(--terra)" />}
                    <button 
                      onClick={() => removeTask(task.id)} 
                      title="Supprimer"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px', opacity: 0.6, transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; }}
                    >
                      <Trash size={16} color="var(--terra)" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add task */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                placeholder="Ajouter une tâche…"
                style={{
                  flex: 1, padding: '8px 12px',
                  border: '1px solid var(--border)', borderRadius: '8px',
                  background: 'var(--warm-white)', fontSize: '0.82rem',
                  color: 'var(--ink)', outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <AddButton onClick={handleAddTask} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['high', 'medium', 'low'] as const).map(p => {
                const isSelected = newPriority === p;
                const priorityConfig = {
                  high: { label: 'Haute', bg: 'var(--terra)', bgLight: 'rgba(192,99,74,0.15)', color: isSelected ? 'white' : 'var(--terra)', fontWeight: 'bold' },
                  medium: { label: 'Moyenne', bg: 'var(--gold)', bgLight: 'rgba(201,151,60,0.15)', color: isSelected ? 'white' : 'var(--gold)', fontWeight: '600' },
                  low: { label: 'Basse', bg: 'var(--sage)', bgLight: 'rgba(107,143,113,0.15)', color: isSelected ? 'white' : 'var(--sage)', fontWeight: '500' },
                };
                const config = priorityConfig[p];
                return (
                  <button key={p} onClick={() => setNewPriority(p)} style={{
                    padding: '8px 16px', 
                    borderRadius: '10px', 
                    border: 'none',
                    background: isSelected ? config.bg : config.bgLight,
                    fontSize: '0.8rem', 
                    cursor: 'pointer', 
                    fontFamily: 'inherit',
                    fontWeight: config.fontWeight,
                    color: config.color,
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = config.bg;
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.background = config.bgLight;
                      e.currentTarget.style.color = config.color;
                    }
                  }}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <PlayfulTodolist />
        </div>

      </div>

      {/* Right column */}
      <div style={{ width: '280px', flexShrink: 0 }}>
        {/* Water intake */}
        <div style={{ 
          background: 'var(--warm-white)', borderRadius: '14px', 
          padding: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 8px rgba(26,23,20,0.04)'
        }}>
          <WaterTracker
            glasses={journal.water_glasses}
            onChange={(glasses) => updateJournal({ water_glasses: glasses })}
          />
        </div>
      </div>
    </div>
  );
}

function WaterTracker({ glasses, onChange }: { glasses: number; onChange: (n: number) => void }) {
  const target = 8;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 className="font-display" style={{ fontSize: '1.1rem', color: 'var(--ink)' }}>
          Hydratation
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--stone)' }}>{glasses}/{target} gourde{target > 1 ? 's' : ''} remplie{glasses > 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {Array.from({ length: target }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => onChange(i < glasses ? i : i + 1)}
            whileTap={{ scale: 0.82 }}
            whileHover={{ scale: 1.12, y: -3 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            style={{
              width: '32px', height: '40px', borderRadius: '8px 8px 6px 6px',
              border: '1.5px solid',
              borderColor: i < glasses ? '#6BA3BE' : 'var(--border)',
              background: i < glasses ? 'rgba(107, 163, 190, 0.15)' : 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem'
            }}
          >
            {i < glasses
              ? <CheckCircle size={16} color="#6BA3BE" />
              : <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid var(--border)' }} />}
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {glasses >= target ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.88, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{ fontSize: '0.76rem', color: 'var(--sage)', marginTop: '10px', fontWeight: 600 }}
          >
            ✓ Objectif atteint !
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ fontSize: '0.76rem', color: 'var(--stone)', marginTop: '10px' }}
          >
            {`Plus que ${target - glasses} gourde${target - glasses > 1 ? 's' : ''} à remplir`}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
