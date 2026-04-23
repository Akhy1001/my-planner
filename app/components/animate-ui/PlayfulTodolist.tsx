'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { CirclePlus, Trash, CheckCircle } from './icons';
import { usePlayfulTodos } from '@/hooks/usePlayfulTodos';

export function PlayfulTodolist() {
  const { todos, loading, addTodo, toggleTodo, removeTodo } = usePlayfulTodos();
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    addTodo(trimmed);
    setNewItem('');
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
        <button
          onClick={handleAdd}
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
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--stone)', textAlign: 'center', padding: '12px 0' }}>
            Chargement…
          </div>
        ) : (
          <AnimatePresence>
            {todos.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: item.done ? 'rgba(192, 99, 74, 0.1)' : 'var(--warm-white)',
                  border: item.done ? '1px solid rgba(192, 99, 74, 0.18)' : '1px solid var(--border)',
                  color: item.done ? 'var(--stone)' : 'var(--ink)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <motion.button
                    onClick={() => toggleTodo(item.id)}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: item.done ? 'var(--terra)' : 'transparent',
                      color: item.done ? 'white' : 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    {item.done ? '✔' : ''}
                  </motion.button>
                  <span style={{
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textDecoration: item.done ? 'line-through' : 'none',
                  }}>
                    {item.label}
                  </span>
                </div>
                <motion.button
                  onClick={() => removeTodo(item.id)}
                  whileTap={{ scale: 0.92 }}
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
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
