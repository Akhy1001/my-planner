'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { CirclePlus, Trash, CheckCircle } from './icons';
import { usePlayfulTodos, DayStat } from '@/hooks/usePlayfulTodos';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// ── Sparkline SVG ─────────────────────────────────────────────────────────────

function TrendSparkline({ data }: { data: DayStat[] }) {
  const W = 400;
  const H = 160;
  const PAD_X = 16;
  const PAD_Y = 20;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2 - 22;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const isEmpty = data.every(d => d.count === 0);

  const points = data.map((d, i) => ({
    x: PAD_X + (i / (data.length - 1)) * innerW,
    y: PAD_Y + innerH - (d.count / maxCount) * innerH,
    ...d,
  }));

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = points[i - 1];
    const cpX = (prev.x + p.x) / 2;
    return `${acc} C ${cpX},${prev.y} ${cpX},${p.y} ${p.x},${p.y}`;
  }, '');

  const fillD = `${pathD} L ${points[points.length - 1].x},${PAD_Y + innerH} L ${points[0].x},${PAD_Y + innerH} Z`;

  if (isEmpty) {
    return (
      <div style={{
        fontSize: '0.85rem',
        color: 'var(--stone)',
        textAlign: 'center',
        padding: '32px 0',
        fontStyle: 'italic',
      }}>
        Commence à compléter des tâches pour voir ta tendance ✦
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ overflow: 'visible' }}
      aria-label="Courbe des tâches accomplies sur 7 jours"
    >
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={PAD_X} y1={PAD_Y + innerH - ratio * innerH}
          x2={W - PAD_X} y2={PAD_Y + innerH - ratio * innerH}
          stroke="var(--border)"
          strokeWidth="1"
        />
      ))}

      <path d={fillD} fill="var(--sage)" opacity={0.10} />
      <path
        d={pathD}
        fill="none"
        stroke="var(--sage)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p) => (
        <g key={p.date}>
          {p.count > 0 && (
            <>
              <circle cx={p.x} cy={p.y} r={5} fill="var(--sage)" />
              <circle cx={p.x} cy={p.y} r={2.5} fill="white" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fill="var(--sage)" fontWeight="600">
                {p.count}
              </text>
            </>
          )}
          <text x={p.x} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--stone)">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Modal Tendance ────────────────────────────────────────────────────────────

function TendanceModal({ data, onClose }: { data: DayStat[]; onClose: () => void }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const best = data.reduce((max, d) => d.count > max.count ? d : max, data[0]);

  return (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(24, 24, 27, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.22, ease: EASE_OUT, delay: 0.05 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--cream)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(24, 24, 27, 0.15)',
          width: '100%',
          maxWidth: '480px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>
              Tendance 7 jours
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--stone)', marginTop: '2px' }}>
              Tâches accomplies dans ta Playful Todolist
            </div>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1, ease: EASE_OUT }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--stone)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </motion.button>
        </div>

        {/* Stats résumées */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            flex: 1,
            background: 'var(--warm-white)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '14px',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--sage)' }}>{total}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--stone)', marginTop: '2px' }}>tâches cette semaine</div>
          </div>
          <div style={{
            flex: 1,
            background: 'var(--warm-white)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '14px',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--terra)' }}>{best.count}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--stone)', marginTop: '2px' }}>meilleur jour — {best.label}</div>
          </div>
        </div>

        {/* Courbe */}
        <div style={{
          background: 'var(--warm-white)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '16px',
        }}>
          <TrendSparkline data={data} />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Zone sous-tâches (expandable) ────────────────────────────────────────────

function SubtaskZone({
  todoId,
  subtasks,
  onAdd,
  onToggle,
  onRemove,
}: {
  todoId: string;
  subtasks: { id: string; label: string; done: boolean }[];
  onAdd: (todoId: string, label: string) => void;
  onToggle: (todoId: string, subtaskId: string) => void;
  onRemove: (todoId: string, subtaskId: string) => void;
}) {
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    onAdd(todoId, trimmed);
    setNewLabel('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto', transition: { duration: 0.22, ease: EASE_OUT } }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.15, ease: EASE_OUT } }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px dashed var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {/* Liste des sous-tâches */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        >
          <AnimatePresence>
            {subtasks.map(sub => (
              <motion.div
                key={sub.id}
                variants={{ hidden: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                exit={{ opacity: 0, x: 6, transition: { duration: 0.13, ease: EASE_OUT } }}
                style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingLeft: '6px',
              }}
            >
              {/* Checkbox sous-tâche */}
              <motion.button
                type="button"
                role="checkbox"
                aria-checked={sub.done}
                aria-label={`Marquer "${sub.label}" comme ${sub.done ? 'non terminée' : 'terminée'}`}
                onClick={() => onToggle(todoId, sub.id)}
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.1, ease: EASE_OUT }}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: sub.done ? '1px solid rgba(107, 142, 120, 0.5)' : '1px solid var(--border)',
                  background: sub.done ? 'var(--sage)' : 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  flexShrink: 0,
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
              >
                {sub.done ? '✔' : ''}
              </motion.button>

              {/* Label */}
              <span style={{
                flex: 1,
                fontSize: '0.82rem',
                color: sub.done ? 'var(--stone)' : 'var(--ink)',
                textDecoration: sub.done ? 'line-through' : 'none',
                opacity: sub.done ? 0.6 : 1,
                transition: 'opacity 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {sub.label}
              </span>

              {/* Supprimer sous-tâche */}
              <motion.button
                type="button"
                aria-label={`Supprimer la sous-tâche "${sub.label}"`}
                onClick={() => onRemove(todoId, sub.id)}
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.1, ease: EASE_OUT }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--terra)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              >
                <X size={12} />
              </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Input nouvelle sous-tâche */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingLeft: '6px' }}>
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Ajouter une sous-tâche…"
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--cream)',
              color: 'var(--ink)',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.8rem',
            }}
          />
          <motion.button
            type="button"
            onClick={handleAdd}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1, ease: EASE_OUT }}
            aria-label="Ajouter sous-tâche"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '9px',
              border: 'none',
              background: 'var(--sage)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CirclePlus size={14} color="white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function PlayfulTodolist() {
  const { todos, loading, weekStats, addTodo, completeTodo, removeTodo, addSubtask, toggleSubtask, removeSubtask } = usePlayfulTodos();
  const [newItem, setNewItem] = useState('');
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    addTodo(trimmed);
    setNewItem('');
  };

  const handleComplete = (id: string) => {
    const todo = todos.find(t => t.id === id);
    const pendingSubtasks = todo?.subtasks.filter(s => !s.done) ?? [];

    if (pendingSubtasks.length > 0) {
      // Ouvrir la zone sous-tâches pour montrer ce qui reste
      setExpandedIds(prev => new Set(prev).add(id));
      // Feedback visuel "bloqué" pendant 600ms
      setBlockedIds(prev => new Set(prev).add(id));
      setTimeout(() => {
        setBlockedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 600);
      return;
    }

    setCompleting(prev => new Set(prev).add(id));
    setTimeout(() => {
      completeTodo(id);
      setCompleting(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setExpandedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 280);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div style={{
        background: 'var(--warm-white)',
        borderRadius: '18px',
        padding: '18px',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 10px rgba(26, 23, 20, 0.04)',
        marginTop: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div className="font-display" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
              Playful Todolist
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--stone)', marginTop: '4px' }}>
              Un mini carnet de tâches animé.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.button
              type="button"
              onClick={() => setShowModal(true)}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12, ease: EASE_OUT }}
              title="Voir la tendance 7 jours"
              style={{
                padding: '5px 10px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--stone)',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
            >
              Tendance
            </motion.button>
            <CheckCircle size={28} color="var(--sage)" />
          </div>
        </div>

        {/* Input ajout tâche principale */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', alignItems: 'center' }}>
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Ajouter une nouvelle tâche..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
              background: 'var(--warm-white)',
              color: 'var(--ink)',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
            }}
          />
          <motion.button
            type="button"
            onClick={handleAdd}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12, ease: EASE_OUT }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              border: 'none',
              background: 'var(--terra)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Ajouter tâche"
          >
            <CirclePlus size={20} color="white" />
          </motion.button>
        </div>

        {/* Liste des tâches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--stone)', textAlign: 'center', padding: '12px 0' }}>
              Chargement…
            </div>
          ) : (
            <AnimatePresence>
              {todos.map((item, index) => {
                const isDone = completing.has(item.id);
                const isExpanded = expandedIds.has(item.id);
                const isBlocked = blockedIds.has(item.id);
                const subCount = item.subtasks.length;
                const subDoneCount = item.subtasks.filter(s => s.done).length;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -4 }}
                    transition={{
                      duration: 0.22,
                      ease: EASE_OUT,
                      delay: index < 6 ? index * 0.05 : 0,
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '16px',
                      background: isDone ? 'rgba(107, 142, 120, 0.08)' : 'var(--warm-white)',
                      border: isDone ? '1px solid rgba(107, 142, 120, 0.22)' : '1px solid var(--border)',
                      color: isDone ? 'var(--stone)' : 'var(--ink)',
                      transition: 'background 0.18s ease, border-color 0.18s ease',
                    }}
                  >
                    {/* Ligne principale */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        {/* Bouton complétion */}
                        <motion.button
                          type="button"
                          onClick={() => !isDone && handleComplete(item.id)}
                          animate={isBlocked ? { x: [0, -5, 5, -4, 4, -2, 2, 0] } : { x: 0 }}
                          transition={isBlocked
                            ? { duration: 0.38, ease: EASE_OUT }
                            : { duration: 0.12, ease: EASE_OUT }
                          }
                          whileTap={isDone || isBlocked ? {} : { scale: 0.92 }}
                          title={isBlocked ? 'Complète d\'abord toutes les sous-tâches' : undefined}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '10px',
                            border: isBlocked
                              ? '1px solid var(--terra)'
                              : isDone
                                ? '1px solid rgba(107, 142, 120, 0.4)'
                                : '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isDone ? 'var(--sage)' : isBlocked ? 'rgba(180, 90, 60, 0.08)' : 'transparent',
                            color: isDone ? 'white' : 'var(--ink)',
                            cursor: isDone ? 'default' : 'pointer',
                            fontSize: '13px',
                            flexShrink: 0,
                            transition: 'background 0.18s ease, border-color 0.18s ease',
                          }}
                        >
                          {isDone ? '✔' : ''}
                        </motion.button>

                        {/* Label + compteur sous-tâches */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'block',
                            textDecoration: isDone ? 'line-through' : 'none',
                            opacity: isDone ? 0.6 : 1,
                            transition: 'opacity 0.15s ease',
                          }}>
                            {item.label}
                          </span>
                          {subCount > 0 && !isDone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                              <div style={{
                                flex: 1,
                                height: '3px',
                                borderRadius: '99px',
                                background: 'var(--border)',
                                overflow: 'hidden',
                              }}>
                                <motion.div
                                  initial={false}
                                  animate={{ scaleX: subDoneCount / subCount || 0 }}
                                  transition={{ duration: 0.28, ease: EASE_OUT }}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '99px',
                                    background: subDoneCount === subCount ? 'var(--sage)' : 'var(--stone)',
                                    transformOrigin: 'left center',
                                    transition: 'background 0.3s ease',
                                  }}
                                />
                              </div>
                              <span style={{
                                fontSize: '0.68rem',
                                color: subDoneCount === subCount ? 'var(--sage)' : 'var(--stone)',
                                flexShrink: 0,
                                transition: 'color 0.3s ease',
                              }}>
                                {subDoneCount}/{subCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions droite */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        {/* Bouton expand sous-tâches */}
                        {!isDone && (
                          <motion.button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            whileTap={{ scale: 0.88 }}
                            transition={{ duration: 0.12, ease: EASE_OUT }}
                            aria-label={isExpanded ? 'Masquer les sous-tâches' : 'Afficher les sous-tâches'}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '10px',
                              border: '1px solid var(--border)',
                              background: isExpanded ? 'var(--cream)' : 'transparent',
                              color: 'var(--stone)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <motion.span
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2, ease: EASE_OUT }}
                              style={{ display: 'flex' }}
                            >
                              <ChevronDown size={14} />
                            </motion.span>
                          </motion.button>
                        )}

                        {/* Bouton supprimer */}
                        <motion.button
                          type="button"
                          onClick={() => removeTodo(item.id)}
                          whileTap={{ scale: 0.88 }}
                          transition={{ duration: 0.12, ease: EASE_OUT }}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--terra)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          aria-label="Supprimer tâche"
                        >
                          <Trash size={18} color="var(--terra)" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Zone sous-tâches */}
                    <AnimatePresence>
                      {isExpanded && !isDone && (
                        <SubtaskZone
                          todoId={item.id}
                          subtasks={item.subtasks}
                          onAdd={addSubtask}
                          onToggle={toggleSubtask}
                          onRemove={removeSubtask}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modal Tendance */}
      <AnimatePresence>
        {showModal && (
          <TendanceModal data={weekStats} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
