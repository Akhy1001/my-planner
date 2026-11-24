'use client';

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import type { Subtask } from '@/hooks/useTasks';

interface TaskSubtasksProps {
  taskId: string;
  taskDone: boolean;
  subtasks: Subtask[];
  onAdd: (taskId: string, text: string) => Promise<void>;
  onToggle: (taskId: string, subtaskId: string) => Promise<void>;
  onRemove: (taskId: string, subtaskId: string) => Promise<void>;
}

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function TaskSubtasks({ taskId, taskDone, subtasks, onAdd, onToggle, onRemove }: TaskSubtasksProps) {
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const doneCount = subtasks.filter(s => s.done).length;
  const hasSubtasks = subtasks.length > 0;
  const listId = `subtasks-${taskId}`;

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const submit = async () => {
    const text = draft.trim();
    if (!text) {
      setAdding(false);
      return;
    }
    setDraft('');
    setExpanded(true);
    await onAdd(taskId, text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    } else if (e.key === 'Escape') {
      setDraft('');
      setAdding(false);
    }
  };

  const chipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.66rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--stone)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as const;

  return (
    <div style={{ marginTop: '6px' }}>
      {/* Barre d'actions : compteur repliable + ajout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {hasSubtasks && (
          <motion.button
            type="button"
            onClick={() => setExpanded(v => !v)}
            whileTap={{ scale: 0.95 }}
            aria-expanded={expanded}
            aria-controls={listId}
            aria-label={`${expanded ? 'Replier' : 'Déplier'} les sous-tâches (${doneCount} sur ${subtasks.length} terminées)`}
            style={{
              ...chipStyle,
              color: doneCount === subtasks.length ? 'var(--ink)' : 'var(--stone)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <motion.span
              animate={{ rotate: expanded ? 0 : -90 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              style={{ display: 'inline-flex' }}
            >
              <ChevronDown size={11} />
            </motion.span>
            {doneCount}/{subtasks.length}
          </motion.button>
        )}

        {!taskDone && !adding && (
          <motion.button
            type="button"
            onClick={() => setAdding(true)}
            whileTap={{ scale: 0.95 }}
            style={{ ...chipStyle, borderStyle: 'dashed' }}
          >
            <Plus size={11} />
            Sous-tâche
          </motion.button>
        )}
      </div>

      {/* Liste des sous-tâches */}
      <AnimatePresence initial={false}>
        {(expanded && hasSubtasks) || adding ? (
          <motion.div
            key="subtask-list"
            id={listId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            style={{ overflow: 'hidden' }}
          >
            <ul
              style={{
                listStyle: 'none',
                margin: '8px 0 0',
                padding: '0 0 0 10px',
                borderLeft: '1.5px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <AnimatePresence initial={false}>
                {expanded && subtasks.map(sub => (
                  <motion.li
                    key={sub.id}
                    layout
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    className="task-subtask-row"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '26px' }}
                  >
                    <motion.button
                      type="button"
                      role="checkbox"
                      aria-checked={sub.done}
                      aria-label={sub.text}
                      onClick={() => void onToggle(taskId, sub.id)}
                      whileTap={{ scale: 0.88 }}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '5px',
                        border: sub.done ? 'none' : '1.5px solid var(--stone-light, #CBD5E1)',
                        background: sub.done ? 'var(--ink)' : 'rgba(0, 0, 0, 0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        padding: 0,
                        transition: 'background-color 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      {sub.done && <Check size={10} color="var(--card, #FFFFFF)" strokeWidth={3.2} />}
                    </motion.button>

                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: sub.done ? 'var(--stone)' : 'var(--ink-light, var(--ink))',
                        textDecoration: sub.done ? 'line-through' : 'none',
                        opacity: sub.done ? 0.65 : 1,
                        wordBreak: 'break-word',
                        transition: 'color 0.15s, opacity 0.15s',
                      }}
                    >
                      {sub.text}
                    </span>

                    <button
                      type="button"
                      onClick={() => void onRemove(taskId, sub.id)}
                      aria-label={`Supprimer la sous-tâche « ${sub.text} »`}
                      className="task-subtask-remove"
                      style={{
                        background: 'rgba(0, 0, 0, 0)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '3px',
                        borderRadius: '6px',
                        display: 'flex',
                        color: 'var(--stone)',
                        flexShrink: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>

              {adding && (
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '26px' }}>
                  <span
                    aria-hidden
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '5px',
                      border: '1.5px dashed var(--stone-light, #CBD5E1)',
                      flexShrink: 0,
                    }}
                  />
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                      if (!draft.trim()) setAdding(false);
                    }}
                    placeholder="Nouvelle sous-tâche… (Entrée pour valider)"
                    aria-label="Nouvelle sous-tâche"
                    maxLength={200}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: '0.8rem',
                      fontFamily: 'inherit',
                      color: 'var(--ink)',
                      background: 'rgba(0, 0, 0, 0)',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      outline: 'none',
                      padding: '3px 0',
                    }}
                  />
                </li>
              )}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
