'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { CirclePlus, Trash, CheckCircle } from './icons';
import { usePlayfulTodos } from '@/hooks/usePlayfulTodos';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function PlayfulTodolist() {
  const { todos, loading, addTodo, completeTodo, removeTodo } = usePlayfulTodos();
  const [newItem, setNewItem] = useState('');
  const [completing, setCompleting] = useState<Set<string>>(new Set());

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    addTodo(trimmed);
    setNewItem('');
  };

  const handleComplete = (id: string) => {
    setCompleting(prev => new Set(prev).add(id));
    setTimeout(() => {
      completeTodo(id);
    }, 280);
  };

  return (
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
        <CheckCircle size={28} color="var(--sage)" />
      </div>

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
          onClick={handleAdd}
          whileTap={{ scale: 0.93 }}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--stone)', textAlign: 'center', padding: '12px 0' }}>
            Chargement…
          </div>
        ) : (
          <AnimatePresence>
            {todos.map((item, index) => {
              const isDone = completing.has(item.id);
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: isDone ? 'rgba(107, 142, 120, 0.08)' : 'var(--warm-white)',
                    border: isDone ? '1px solid rgba(107, 142, 120, 0.22)' : '1px solid var(--border)',
                    color: isDone ? 'var(--stone)' : 'var(--ink)',
                    transition: 'background 0.18s ease, border-color 0.18s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <motion.button
                      onClick={() => !isDone && handleComplete(item.id)}
                      whileTap={isDone ? {} : { scale: 0.88 }}
                      transition={{ duration: 0.12, ease: EASE_OUT }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '10px',
                        border: isDone ? '1px solid rgba(107, 142, 120, 0.4)' : '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isDone ? 'var(--sage)' : 'transparent',
                        color: isDone ? 'white' : 'var(--ink)',
                        cursor: isDone ? 'default' : 'pointer',
                        fontSize: '13px',
                        flexShrink: 0,
                        transition: 'background 0.18s ease, border-color 0.18s ease',
                      }}
                    >
                      {isDone ? '✔' : ''}
                    </motion.button>
                    <span style={{
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textDecoration: isDone ? 'line-through' : 'none',
                      transition: 'text-decoration 0.1s ease',
                    }}>
                      {item.label}
                    </span>
                  </div>
                  <motion.button
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
