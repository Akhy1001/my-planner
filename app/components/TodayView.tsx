'use client';
import AddButton from './AddButton';
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
          background: 'white', borderRadius: '14px', 
          padding: '20px', marginBottom: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 8px rgba(26,23,20,0.04)'
        }} className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--stone)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Progression du jour</span>
            <span className="font-display" style={{ fontSize: '1.4rem', color: 'var(--ink)', }}>{progress}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${progress}%`, 
              background: 'linear-gradient(90deg, var(--sage), var(--sage-light))',
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--stone)', marginTop: '8px' }}>
            {loading ? 'Chargement…' : `${doneTasks} tâche${doneTasks !== 1 ? 's' : ''} complétée${doneTasks !== 1 ? 's' : ''} sur ${tasks.length}`}
          </div>
        </div>

        {/* Tasks */}
        <div style={{ 
          background: 'white', borderRadius: '14px', 
          padding: '20px', marginBottom: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 8px rgba(26,23,20,0.04)'
        }}>
          <h2 className="font-display" style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--ink)' }}>
            Tâches du jour
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--stone)', fontSize: '0.85rem' }}>Chargement…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {tasks.map((task, i) => (
                <div key={task.id} 
                  className="animate-slide-in"
                  style={{ 
                    animationDelay: `${i * 0.05}s`,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: task.done ? 'var(--warm-white)' : 'transparent',
                    border: '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}>
                  <div className={`task-check ${task.done ? 'checked' : ''}`} onClick={() => toggleTask(task.id)}>
                    {task.done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '0.85rem', color: task.done ? 'var(--stone)' : 'var(--ink)',
                      textDecoration: task.done ? 'line-through' : 'none',
                      transition: 'all 0.2s'
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
                    <div className={`priority-${task.priority}`} style={{ 
                      width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0
                    }} />
                    <button onClick={() => removeTask(task.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--stone-light)', fontSize: '1rem', lineHeight: 1,
                      padding: '0 2px', opacity: 0.5
                    }}>×</button>
                  </div>
                </div>
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
        </div>

      </div>

      {/* Right column */}
      <div style={{ width: '280px', flexShrink: 0 }}>
        {/* Intention */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--ink) 0%, var(--ink-light) 100%)',
          borderRadius: '14px', padding: '22px', marginBottom: '20px',
          color: 'var(--cream)'
        }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, marginBottom: '10px' }}>
            Intention du jour
          </div>
          <textarea
            value={journal.intention}
            onChange={e => updateJournal({ intention: e.target.value })}
            placeholder="Quelle est votre intention pour aujourd'hui?"
            rows={3}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              color: 'var(--cream)', fontSize: '0.88rem', resize: 'none',
              outline: 'none', fontFamily: "'Nunito', sans-serif",
              lineHeight: 1.6
            }}
          />
        </div>

        {/* Gratitude */}
        <div style={{ 
          background: 'white', borderRadius: '14px', 
          padding: '20px', marginBottom: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 8px rgba(26,23,20,0.04)'
        }}>
          <h2 className="font-display" style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--ink)' }}>
            Gratitude
          </h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--stone)', marginBottom: '14px' }}>
            3 choses pour lesquelles je suis reconnaissant·e
          </div>
          {journal.gratitude.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ 
                fontSize: '0.7rem', color: 'var(--gold)', 
                width: '20px', textAlign: 'center', fontWeight: 500 
              }}>
                {i + 1}.
              </span>
              <input
                value={g}
                onChange={e => {
                  const arr = [...journal.gratitude];
                  arr[i] = e.target.value;
                  updateJournal({ gratitude: arr });
                }}
                placeholder={['Je suis reconnaissant pour…', 'Je suis heureux de…', "Aujourd'hui, j'apprécie…"][i]}
                style={{
                  flex: 1, padding: '7px 10px',
                  border: '1px solid var(--border)', borderRadius: '7px',
                  background: 'var(--warm-white)', fontSize: '0.8rem',
                  color: 'var(--ink)', outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>
          ))}
        </div>

        {/* Water intake */}
        <div style={{ 
          background: 'white', borderRadius: '14px', 
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
        <span style={{ fontSize: '0.8rem', color: 'var(--stone)' }}>{glasses}/{target}</span>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {Array.from({ length: target }).map((_, i) => (
          <button key={i} onClick={() => onChange(i < glasses ? i : i + 1)} style={{
            width: '32px', height: '40px', borderRadius: '8px 8px 6px 6px',
            border: '1.5px solid',
            borderColor: i < glasses ? '#6BA3BE' : 'var(--border)',
            background: i < glasses ? 'rgba(107, 163, 190, 0.15)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.15s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem'
          }}>
            {i < glasses ? '💧' : '○'}
          </button>
        ))}
      </div>
      <div style={{ fontSize: '0.76rem', color: 'var(--stone)', marginTop: '10px' }}>
        {glasses >= target ? '✓ Objectif atteint !' : `Plus que ${target - glasses} verre${target - glasses > 1 ? 's' : ''}`}
      </div>
    </>
  );
}
