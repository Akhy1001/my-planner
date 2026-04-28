'use client';
import AddButton from './AddButton';
import { Target, ScribbleStrikethrough } from './animate-ui';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGoals, Goal } from '@/hooks/useGoals';

const categoryColors: Record<string, string> = {
  'Croissance': 'var(--lavender)',
  'Santé': 'var(--terra)',
  'Carrière': 'var(--gold)',
  'Personnel': 'var(--sage)',
};

export default function GoalsView() {
  const { goals, loading, addGoal, toggleMilestone, addMilestone } = useGoals();
  const [selected, setSelected] = useState<Goal | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'Personnel', deadline: '', color: 'var(--sage)' });

  // Keep selected goal in sync with hook state
  const selectedGoal = selected ? goals.find(g => g.id === selected.id) ?? null : null;

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) return;
    const goal = await addGoal({
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      deadline: newGoal.deadline,
      color: categoryColors[newGoal.category] || 'var(--sage)',
    });
    if (goal) setSelected(goal);
    setShowAdd(false);
    setNewGoal({ title: '', description: '', category: 'Personnel', deadline: '', color: 'var(--sage)' });
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    await toggleMilestone(goalId, milestoneId);
  };

  const handleAddMilestone = async (goalId: string, text: string) => {
    if (!text.trim()) return;
    await addMilestone(goalId, text);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Goals list */}
      <div style={{ 
        width: '300px', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', padding: '24px 16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
          <h1 className="font-display" style={{ fontSize: '1.6rem', color: 'var(--ink)' }}>Objectifs</h1>
          <AddButton onClick={() => setShowAdd(!showAdd)} />
        </div>

        {showAdd && (
          <div style={{ 
            background: 'var(--warm-white)', borderRadius: '12px', padding: '14px',
            border: '1px solid var(--border)', marginBottom: '14px'
          }}>
            <input value={newGoal.title} onChange={e => setNewGoal({...newGoal, title: e.target.value})}
              placeholder="Titre de l'objectif" style={{ ...iS, marginBottom: '8px' }} />
            <textarea value={newGoal.description} onChange={e => setNewGoal({...newGoal, description: e.target.value})}
              placeholder="Description…" rows={2}
              style={{ ...iS, resize: 'none', marginBottom: '8px' }} />
            <select value={newGoal.category} onChange={e => setNewGoal({...newGoal, category: e.target.value})}
              style={{ ...iS, marginBottom: '8px' }}>
              {Object.keys(categoryColors).map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={newGoal.deadline} onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
              style={{ ...iS, marginBottom: '8px' }} />
            <button onClick={handleAddGoal} style={{
              width: '100%', padding: '7px', background: 'var(--ink)', color: 'var(--cream)',
              border: 'none', borderRadius: '7px', cursor: 'pointer',
              fontSize: '0.8rem', fontFamily: 'inherit'
            }}>Créer</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--stone)', fontSize: '0.85rem' }}>Chargement…</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {goals.map((goal, i) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                transition={{ duration: 0.22, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => setSelected(goal)}
                style={{
                  padding: '14px', borderRadius: '12px', marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s cubic-bezier(0.23, 1, 0.32, 1), background 0.15s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.15s cubic-bezier(0.23, 1, 0.32, 1)',
                  border: `1px solid ${selectedGoal?.id === goal.id ? goal.color : 'var(--border)'}`,
                  background: selectedGoal?.id === goal.id ? 'var(--warm-white)' : 'transparent',
                  boxShadow: selectedGoal?.id === goal.id ? '0 2px 8px rgba(26,23,20,0.06)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--ink)' }}>{goal.title}</div>
                    <div style={{ fontSize: '0.7rem', color: categoryColors[goal.category] || 'var(--stone)', marginTop: '2px' }}>
                      {goal.category}
                    </div>
                  </div>
                  <div className="font-display" style={{ fontSize: '1.1rem', color: goal.color }}>
                    {goal.progress}%
                  </div>
                </div>
                <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${goal.progress}%`,
                    background: goal.color, borderRadius: '2px', transition: 'width 0.4s ease'
                  }} />
                </div>
                {goal.deadline && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--stone)', marginTop: '6px' }}>
                    📅 {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Goal detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        {selectedGoal ? (
          <GoalDetail goal={selectedGoal} onToggle={handleToggleMilestone} onAddMilestone={handleAddMilestone} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--stone)' }}>
            <div className="font-display" style={{ }}>Sélectionnez un objectif</div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalDetail({ goal, onToggle, onAddMilestone }: { goal: Goal; onToggle: (gId: string, mId: string) => void; onAddMilestone: (gId: string, text: string) => void }) {
  const [newMs, setNewMs] = useState('');

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '10px',
            background: (categoryColors[goal.category] || 'var(--sage)') + '20',
            color: categoryColors[goal.category] || 'var(--sage)',
            border: `1px solid ${(categoryColors[goal.category] || 'var(--sage)')}40`
          }}>{goal.category}</span>
          {goal.deadline && <span style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>
            📅 {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>}
        </div>
        <h2 className="font-display" style={{ fontSize: '2rem', color: 'var(--ink)', marginBottom: '8px' }}>
          {goal.title}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--stone)', lineHeight: 1.6 }}>{goal.description}</p>
      </div>

      {/* Progress */}
      <div style={{ 
        background: 'var(--warm-white)', borderRadius: '14px', padding: '20px 24px',
        border: '1px solid var(--border)', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progression</span>
          <span className="font-display" style={{ fontSize: '1.6rem', color: goal.color, }}>{goal.progress}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${goal.progress}%`, background: goal.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--stone)', marginTop: '8px' }}>
          {goal.milestones.filter(m => m.done).length} étape{goal.milestones.filter(m => m.done).length !== 1 ? 's' : ''} sur {goal.milestones.length} complétée{goal.milestones.filter(m => m.done).length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Milestones */}
      <div style={{ background: 'var(--warm-white)', borderRadius: '14px', padding: '20px 24px', border: '1px solid var(--border)' }}>
        <h3 className="font-display" style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--ink)' }}>Étapes clés</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {goal.milestones.map((ms, i) => (
            <div key={ms.id} onClick={() => onToggle(goal.id, ms.id)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: '8px',
              cursor: 'pointer', transition: 'background 0.15s',
              background: ms.done ? 'var(--warm-white)' : 'transparent',
              border: '1px solid transparent',
              animationDelay: `${i * 0.05}s`
            }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                border: `2px solid ${ms.done ? goal.color : 'var(--stone-light)'}`,
                background: ms.done ? goal.color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'border-color 0.2s cubic-bezier(0.23, 1, 0.32, 1), background 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
              }}>
                {ms.done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>}
              </div>
              <span style={{
                fontSize: '0.85rem', color: ms.done ? 'var(--stone)' : 'var(--ink)',
                position: 'relative', display: 'inline',
              }}>
                {ms.text}
                <ScribbleStrikethrough active={ms.done} color="var(--stone)" />
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
          <input value={newMs} onChange={e => setNewMs(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { onAddMilestone(goal.id, newMs); setNewMs(''); } }}
            placeholder="Ajouter une étape…" style={{ flex: 1, ...iS }} />
          <button onClick={() => { onAddMilestone(goal.id, newMs); setNewMs(''); }} style={{
            padding: '7px 14px', background: 'var(--ink)', color: 'var(--cream)',
            border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit'
          }}>+</button>
        </div>
      </div>
    </div>
  );
}

const iS: React.CSSProperties = {
  width: '100%', padding: '7px 10px',
  border: '1px solid var(--border)', borderRadius: '7px',
  background: 'var(--warm-white)', fontSize: '0.82rem',
  color: 'var(--ink)', outline: 'none', fontFamily: 'inherit'
};
