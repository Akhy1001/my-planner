'use client';
import AddButton from './AddButton';
import { Target, ScribbleStrikethrough, TextReveal } from './animate-ui';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGoals, Goal } from '@/hooks/useGoals';
import { Calendar, Trash2, Pencil, Check, X, AlertCircle } from 'lucide-react';

const categoryColors: Record<string, string> = {
  'Croissance': 'var(--lavender)',
  'Santé': 'var(--terra)',
  'Carrière': 'var(--gold)',
  'Personnel': 'var(--sage)',
};

export default function GoalsView() {
  const {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    addMilestone,
    editMilestone,
    deleteMilestone,
  } = useGoals();

  const [selected, setSelected] = useState<Goal | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'Personnel', deadline: '', color: 'var(--sage)' });

  // Keep selected goal in sync with hook state
  const selectedGoal = selected ? goals.find(g => g.id === selected.id) ?? null : null;

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) return;
    const goal = await addGoal({
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
      category: newGoal.category,
      deadline: newGoal.deadline,
      color: categoryColors[newGoal.category] || 'var(--sage)',
    });
    if (goal) setSelected(goal);
    setShowAdd(false);
    setNewGoal({ title: '', description: '', category: 'Personnel', deadline: '', color: 'var(--sage)' });
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (selected?.id === goalId) {
      setSelected(null);
    }
    await deleteGoal(goalId);
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    await toggleMilestone(goalId, milestoneId);
  };

  const handleAddMilestone = async (goalId: string, text: string) => {
    if (!text.trim()) return;
    await addMilestone(goalId, text);
  };

  return (
    <div className="goals-view-container">
      {/* Goals list */}
      <div className="goals-sidebar-panel" style={{ 
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', padding: '24px 16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
          <TextReveal
            as="h1"
            delay={0.06}
            className="font-display"
            style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}
          >
            Objectifs
          </TextReveal>
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
            <motion.button
              onClick={handleAddGoal}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%', padding: '10px',
                background: 'var(--primary-btn-bg, var(--ink))', color: 'var(--primary-btn-fg, var(--cream))',
                border: 'none', borderRadius: '14px', cursor: 'pointer',
                fontSize: '0.84rem', fontFamily: 'inherit', fontWeight: 600,
                boxShadow: '0 2px 8px var(--primary-btn-shadow, rgba(15, 23, 42, 0.12))',
                transition: 'background 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-btn-hover, var(--ink-light))'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-btn-bg, var(--ink))'; }}
            >
              Créer
            </motion.button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--stone)', fontSize: '0.85rem' }}>Chargement…</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {goals.map((goal, i) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ duration: 0.22, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => setSelected(goal)}
                style={{
                  padding: '14px', borderRadius: '12px', marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s cubic-bezier(0.23, 1, 0.32, 1), background 0.15s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.15s cubic-bezier(0.23, 1, 0.32, 1)',
                  border: `1px solid ${selectedGoal?.id === goal.id ? goal.color : 'var(--border)'}`,
                  background: selectedGoal?.id === goal.id ? 'var(--warm-white)' : 'transparent',
                  boxShadow: selectedGoal?.id === goal.id ? '0 2px 8px rgba(26,23,20,0.06)' : 'none',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {goal.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: categoryColors[goal.category] || 'var(--stone)', marginTop: '2px' }}>
                      {goal.category}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="font-display" style={{ fontSize: '1.1rem', color: goal.color }}>
                      {goal.progress}%
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.15, color: '#EF4444' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Supprimer l'objectif "${goal.title}" ?`)) {
                          handleDeleteGoal(goal.id);
                        }
                      }}
                      title="Supprimer cet objectif"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--stone)',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; }}
                    >
                      <Trash2 size={13} />
                    </motion.button>
                  </div>
                </div>
                <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${goal.progress}%`,
                    background: goal.color, borderRadius: '2px', transition: 'width 0.4s ease'
                  }} />
                </div>
                {goal.deadline && (
                  <div style={{
                    fontSize: '0.68rem',
                    color: 'var(--stone)',
                    marginTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    <Calendar size={11} strokeWidth={1.8} style={{ opacity: 0.8, flexShrink: 0 }} />
                    <span>{new Date(goal.deadline + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Goal detail */}
      <div className="goals-detail-panel" style={{ flex: 1, overflowY: 'auto' }}>
        {selectedGoal ? (
          <GoalDetail
            goal={selectedGoal}
            onToggle={handleToggleMilestone}
            onAddMilestone={handleAddMilestone}
            onEditMilestone={editMilestone}
            onDeleteMilestone={deleteMilestone}
            onUpdateGoal={updateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--stone)' }}>
            <div className="font-display" style={{ }}>Sélectionnez un objectif</div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalDetail({
  goal,
  onToggle,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onUpdateGoal,
  onDeleteGoal,
}: {
  goal: Goal;
  onToggle: (gId: string, mId: string) => void;
  onAddMilestone: (gId: string, text: string) => void;
  onEditMilestone: (gId: string, mId: string, text: string) => void;
  onDeleteMilestone: (gId: string, mId: string) => void;
  onUpdateGoal: (gId: string, updates: Partial<Omit<Goal, 'id' | 'milestones'>>) => void;
  onDeleteGoal: (gId: string) => void;
}) {
  const [newMs, setNewMs] = useState('');
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editingMilestoneText, setEditingMilestoneText] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editGoalData, setEditGoalData] = useState({
    title: goal.title,
    description: goal.description,
    category: goal.category,
    deadline: goal.deadline,
  });

  // Sync editGoalData when goal changes
  useEffect(() => {
    setEditGoalData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      deadline: goal.deadline,
    });
    setIsEditingGoal(false);
    setShowDeleteConfirm(false);
    setEditingMilestoneId(null);
  }, [goal.id]);

  const handleSaveGoal = () => {
    if (!editGoalData.title.trim()) return;
    onUpdateGoal(goal.id, {
      title: editGoalData.title.trim(),
      description: editGoalData.description.trim(),
      category: editGoalData.category,
      deadline: editGoalData.deadline,
      color: categoryColors[editGoalData.category] || goal.color,
    });
    setIsEditingGoal(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        {/* Top bar with category & action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '10px',
              background: (categoryColors[goal.category] || 'var(--sage)') + '20',
              color: categoryColors[goal.category] || 'var(--sage)',
              border: `1px solid ${(categoryColors[goal.category] || 'var(--sage)')}40`
            }}>{goal.category}</span>
            {goal.deadline && (
              <span style={{
                fontSize: '0.72rem',
                color: 'var(--stone)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <Calendar size={12} strokeWidth={1.8} style={{ opacity: 0.8, flexShrink: 0 }} />
                <span>{new Date(goal.deadline + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </span>
            )}
          </div>

          {/* Actions : Modifier et Supprimer l'objectif */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              title="Modifier l'objectif"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '9px',
                border: '1px solid var(--border)',
                background: isEditingGoal ? 'var(--muted)' : 'var(--warm-white)',
                color: 'var(--ink)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Pencil size={12} />
              <span>{isEditingGoal ? 'Fermer' : 'Modifier'}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              title="Supprimer l'objectif"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '9px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                background: 'rgba(239, 68, 68, 0.06)',
                color: '#EF4444',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={12} />
              <span>Supprimer</span>
            </motion.button>
          </div>
        </div>

        {/* Confirmation de suppression de l'objectif */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                marginTop: '10px',
                marginBottom: '14px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#EF4444', fontWeight: 600 }}>
                <AlertCircle size={15} />
                <span>Supprimer cet objectif et toutes ses étapes clés ?</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--warm-white)',
                    color: 'var(--ink)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => onDeleteGoal(goal.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#EF4444',
                    color: '#fff',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Confirmer la suppression
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulaire de modification de l'objectif */}
        <AnimatePresence>
          {isEditingGoal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                overflow: 'hidden',
                marginTop: '10px',
                marginBottom: '16px',
                background: 'var(--warm-white)',
                borderRadius: '14px',
                padding: '16px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '10px' }}>
                Modifier l&apos;objectif
              </div>
              <input
                value={editGoalData.title}
                onChange={e => setEditGoalData({ ...editGoalData, title: e.target.value })}
                placeholder="Titre de l'objectif"
                style={{ ...iS, marginBottom: '8px' }}
              />
              <textarea
                value={editGoalData.description}
                onChange={e => setEditGoalData({ ...editGoalData, description: e.target.value })}
                placeholder="Description…"
                rows={2}
                style={{ ...iS, resize: 'none', marginBottom: '8px' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <select
                  value={editGoalData.category}
                  onChange={e => setEditGoalData({ ...editGoalData, category: e.target.value })}
                  style={iS}
                >
                  {Object.keys(categoryColors).map(c => <option key={c}>{c}</option>)}
                </select>
                <input
                  type="date"
                  value={editGoalData.deadline}
                  onChange={e => setEditGoalData({ ...editGoalData, deadline: e.target.value })}
                  style={iS}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditingGoal(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '9px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--stone)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveGoal}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9px',
                    border: 'none',
                    background: 'var(--primary-btn-bg, var(--ink))',
                    color: 'var(--primary-btn-fg, var(--cream))',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <TextReveal
          as="h2"
          key={goal.id + goal.title}
          delay={0.05}
          className="font-display"
          style={{ fontSize: '2rem', color: 'var(--ink)', marginBottom: '8px' }}
        >
          {goal.title}
        </TextReveal>
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
          <AnimatePresence mode="popLayout">
            {goal.milestones.map((ms) => (
              editingMilestoneId === ms.id ? (
                <motion.div
                  key={ms.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'var(--warm-white)',
                    border: '1.5px solid var(--accent)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <input
                    value={editingMilestoneText}
                    onChange={e => setEditingMilestoneText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (editingMilestoneText.trim()) {
                          onEditMilestone(goal.id, ms.id, editingMilestoneText);
                          setEditingMilestoneId(null);
                        }
                      } else if (e.key === 'Escape') {
                        setEditingMilestoneId(null);
                      }
                    }}
                    autoFocus
                    placeholder="Modifier l'étape…"
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      fontSize: '0.85rem',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: 'var(--ink)',
                      fontFamily: 'inherit',
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.06 }}
                    onClick={() => {
                      if (editingMilestoneText.trim()) {
                        onEditMilestone(goal.id, ms.id, editingMilestoneText);
                        setEditingMilestoneId(null);
                      }
                    }}
                    title="Valider"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--primary-btn-bg, var(--ink))',
                      color: 'var(--primary-btn-fg, var(--cream))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={14} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.06 }}
                    onClick={() => setEditingMilestoneId(null)}
                    title="Annuler"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--stone)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key={ms.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                    background: ms.done ? 'rgba(0,0,0,0.02)' : 'var(--warm-white)',
                    border: '1px solid var(--border)',
                  }}
                  onClick={() => onToggle(goal.id, ms.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
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
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {ms.text}
                      <ScribbleStrikethrough active={ms.done} color="var(--stone)" />
                    </span>
                  </div>

                  {/* Actions d'étape (Modifier / Supprimer) */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '10px', flexShrink: 0 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.12, color: 'var(--ink)' }}
                      onClick={() => {
                        setEditingMilestoneId(ms.id);
                        setEditingMilestoneText(ms.text);
                      }}
                      title="Modifier cette étape"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--stone)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={13} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.12, color: '#EF4444' }}
                      onClick={() => onDeleteMilestone(goal.id, ms.id)}
                      title="Supprimer cette étape"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--stone)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </motion.button>
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px', alignItems: 'center' }}>
          <input value={newMs} onChange={e => setNewMs(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { onAddMilestone(goal.id, newMs); setNewMs(''); } }}
            placeholder="Ajouter une étape…" style={{ flex: 1, ...iS }} />
          <motion.button
            onClick={() => { onAddMilestone(goal.id, newMs); setNewMs(''); }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              padding: '9px 16px', background: 'var(--primary-btn-bg, var(--ink))', color: 'var(--primary-btn-fg, var(--cream))',
              border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '0.84rem', fontFamily: 'inherit', fontWeight: 600,
              boxShadow: '0 2px 8px var(--primary-btn-shadow, rgba(15, 23, 42, 0.12))',
              transition: 'background 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-btn-hover, var(--ink-light))'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-btn-bg, var(--ink))'; }}
          >
            +
          </motion.button>
        </div>
      </div>
    </div>
  );
}

const iS: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid var(--border)', borderRadius: '14px',
  background: 'var(--warm-white)', fontSize: '0.84rem',
  color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
  transition: 'all 0.22s ease',
};
