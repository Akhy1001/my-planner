'use client';
import AddButton from './AddButton';
import { Trash } from './animate-ui';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, eachDayOfInterval, subDays } from 'date-fns';
import { useHabits } from '@/hooks/useHabits';

const today = format(new Date(), 'yyyy-MM-dd');
const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() }).map(d => format(d, 'yyyy-MM-dd'));
const last7 = last30Days.slice(-7);

export default function HabitsView() {
  const { habits, loading, toggleToday, addHabit, deleteHabit } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '⭐', color: 'var(--sage)', target: 7 });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleAddHabit = async () => {
    if (!newHabit.name.trim()) return;
    await addHabit(newHabit);
    setNewHabit({ name: '', icon: '⭐', color: 'var(--sage)', target: 7 });
    setShowAdd(false);
  };

  const overallProgress = habits.filter(h => h.completedDays.includes(today)).length;

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2rem', color: 'var(--ink)', marginBottom: '4px' }}>
            Habitudes
          </h1>
          <div style={{ fontSize: '0.82rem', color: 'var(--stone)' }}>
            {loading ? 'Chargement…' : `${overallProgress}/${habits.length} complétées aujourd'hui`}
          </div>
        </div>
        <AddButton onClick={() => setShowAdd(!showAdd)} label="Habitude" />
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ 
          background: 'var(--warm-white)', borderRadius: '14px', padding: '20px',
          border: '1px solid var(--border)', marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(26,23,20,0.06)'
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input value={newHabit.icon} onChange={e => setNewHabit({...newHabit, icon: e.target.value})}
              style={{ width: '50px', textAlign: 'center', ...inputStyle }} />
            <input value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})}
              placeholder="Nom de l'habitude" style={{ flex: 1, ...inputStyle }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--stone)' }}>Objectif:</span>
            {[3, 5, 7].map(n => (
              <button key={n} onClick={() => setNewHabit({...newHabit, target: n})} style={{
                padding: '4px 10px', borderRadius: '6px',
                border: '1px solid var(--border)',
                background: newHabit.target === n ? 'var(--ink)' : 'transparent',
                color: newHabit.target === n ? 'white' : 'var(--stone)',
                cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit'
              }}>{n}j/sem</button>
            ))}
          </div>
          <button onClick={handleAddHabit} style={{
            width: '100%', padding: '8px', background: 'var(--sage)', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontSize: '0.82rem', fontFamily: 'inherit'
          }}>Créer l&apos;habitude</button>
        </div>
      )}

      {/* Stats row */}
      {!loading && habits.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Meilleure série', value: Math.max(...habits.map(h => h.streak), 0), unit: 'jours' },
            { label: 'Ce mois', value: habits.reduce((acc, h) => acc + h.completedDays.filter(d => d >= format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')).length, 0), unit: 'complétions' },
            { label: 'Taux global', value: habits.length > 0 ? Math.round((habits.filter(h => h.completedDays.includes(today)).length / habits.length) * 100) : 0, unit: '%' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--warm-white)', borderRadius: '12px', padding: '16px',
              border: '1px solid var(--border)', textAlign: 'center'
            }}>
              <div className="font-display" style={{ fontSize: '1.8rem', color: 'var(--ink)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.unit}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--stone)', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--stone)', fontSize: '0.85rem' }}>
          Chargement des habitudes…
        </div>
      )}

      {/* Habits list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence mode="popLayout">
          {habits.map((habit, idx) => {
            const doneToday = habit.completedDays.includes(today);
            const weekRate = Math.round((last7.filter(d => habit.completedDays.includes(d)).length / 7) * 100);

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                transition={{ duration: 0.22, delay: idx * 0.05, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  background: 'var(--warm-white)', borderRadius: '14px',
                  padding: '18px 20px',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${habit.color}`,
                  boxShadow: '0 1px 6px rgba(26,23,20,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{habit.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--ink)' }}>{habit.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--stone)', marginTop: '1px' }}>
                      🔥 {habit.streak} jours · objectif {habit.target}j/sem
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--stone)' }}>{weekRate}%</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--stone-light)' }}>cette sem.</div>
                    </div>
                    {confirmingId === habit.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <motion.button
                          initial={{ opacity: 0, scale: 0.95, x: -4 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { deleteHabit(habit.id); setConfirmingId(null); }}
                          style={{
                            padding: '4px 10px', borderRadius: '6px',
                            border: '1px solid var(--terra)',
                            background: 'var(--terra)', color: 'white',
                            cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'inherit'
                          }}
                        >
                          Confirmer
                        </motion.button>
                        <motion.button
                          initial={{ opacity: 0, scale: 0.95, x: -4 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setConfirmingId(null)}
                          style={{
                            padding: '4px 8px', borderRadius: '6px',
                            border: '1px solid var(--border)',
                            background: 'transparent', color: 'var(--stone)',
                            cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'inherit'
                          }}
                        >
                          Annuler
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        onClick={() => setConfirmingId(habit.id)}
                        title="Supprimer l'habitude"
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        style={{
                          width: '28px', height: '28px', borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'transparent', color: 'var(--stone)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.8rem', lineHeight: 1
                        }}
                      >
                        <Trash size={14} color="var(--terra)" />
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => toggleToday(habit.id)}
                      whileTap={{ scale: 0.9 }}
                      animate={{
                        borderColor: doneToday ? habit.color : 'var(--border)',
                        background: doneToday ? habit.color : 'transparent',
                      }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        border: `2px solid ${doneToday ? habit.color : 'var(--border)'}`,
                        background: doneToday ? habit.color : 'transparent',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: doneToday ? '1rem' : '0.9rem',
                        color: doneToday ? 'white' : 'var(--stone)'
                      }}
                    >
                      {doneToday ? '✓' : '○'}
                    </motion.button>
                  </div>
                </div>

                {/* Mini tracker last 30 days */}
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                  {last30Days.map(day => (
                    <div key={day} style={{
                      width: '10px', height: '10px', borderRadius: '2px',
                      background: habit.completedDays.includes(day) ? habit.color : 'var(--border)',
                      opacity: day === today ? 1 : 0.8,
                      outline: day === today ? `1px solid var(--terra)` : 'none',
                      outlineOffset: '1px'
                    }} title={day} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--border)', borderRadius: '8px',
  background: 'var(--warm-white)', fontSize: '0.82rem',
  color: 'var(--ink)', outline: 'none', fontFamily: 'inherit'
};
