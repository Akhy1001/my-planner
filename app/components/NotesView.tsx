'use client';
import AddButton from './AddButton';
import { TextReveal } from './animate-ui';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotes, Note } from '@/hooks/useNotes';
import FormatToolbar from './FormatToolbar';
import { Pin } from 'lucide-react';

const tagColors: Record<string, string> = {
  'Idées': 'var(--gold)',
  'Travail': 'var(--sage)',
  'Personnel': 'var(--lavender)',
  'Projets': 'var(--terra)',
};

export default function NotesView() {
  const { notes, loading, addNote, updateNote, togglePin, deleteNote } = useNotes();
  const [selected, setSelected] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [formatState, setFormatState] = useState({ bold: false, underline: false });
  const editorRef = useRef<HTMLDivElement>(null);
  const prevNoteIdRef = useRef<string | undefined>(undefined);
  const savedRangeRef = useRef<Range | null>(null);

  // Keep selected in sync when notes update
  const selectedNote = selected ? notes.find(n => n.id === selected.id) ?? null : null;

  // Sync editor innerHTML only when the note ID changes (not on every content update)
  // prevNoteIdRef tracks the last synced ID so typing doesn't reset the cursor
  useEffect(() => {
    if (!editorRef.current) return;
    if (prevNoteIdRef.current === selectedNote?.id) return;
    prevNoteIdRef.current = selectedNote?.id;
    editorRef.current.innerHTML = selectedNote?.content ?? '';
  }, [selectedNote?.id, selectedNote?.content]);

  const handleEditorInput = () => {
    if (!selectedNote || !editorRef.current) return;
    updateNote(selectedNote.id, 'content', editorRef.current.innerHTML);
  };

  useEffect(() => {
    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setToolbarPos(null);
        return;
      }
      if (!editorRef.current?.contains(selection.anchorNode)) {
        return;
      }
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0) { setToolbarPos(null); return; }
      savedRangeRef.current = range.cloneRange();
      setToolbarPos({ top: rect.top - 48, left: rect.left + rect.width / 2 });
      setFormatState({
        bold: document.queryCommandState('bold'),
        underline: document.queryCommandState('underline'),
      });
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const applyFormat = (command: string, value?: string) => {
    if (savedRangeRef.current && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
    document.execCommand(command, false, value);
    setFormatState({
      bold: document.queryCommandState('bold'),
      underline: document.queryCommandState('underline'),
    });
  };

  const filtered = notes
    .filter(n => !filterTag || n.tag === filterTag)
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const handleAddNote = async () => {
    const note = await addNote();
    if (note) setSelected(note);
  };

  const handleUpdateNote = (field: string, value: string) => {
    if (!selectedNote) return;
    updateNote(selectedNote.id, field, value);
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date().getTime();
    const diff = now - new Date(dateStr).getTime();
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return `Il y a ${Math.floor(diff / 86400000)}j`;
  };

  return (
    <div className="notes-view-container">
      {/* Left panel */}
      <div className="notes-sidebar-panel" style={{ 
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--warm-white)'
      }}>
        {/* Search + Add */}
        <div style={{ padding: '20px 16px 12px' }}>
          <div style={{ marginBottom: '14px' }}>
            <TextReveal
              as="h1"
              delay={0.06}
              className="font-display"
              style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)' }}
            >
              Notes
            </TextReveal>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{
                flex: 1, padding: '7px 10px',
                border: '1px solid var(--border)', borderRadius: '8px',
                background: 'var(--warm-white)', fontSize: '0.8rem',
                color: 'var(--ink)', outline: 'none', fontFamily: 'inherit'
              }}
            />
            <AddButton onClick={handleAddNote} size={18} />
          </div>
          {/* Tags filter avec pilule glissante (sans encadrement) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
              position: 'relative',
              scrollbarWidth: 'none',
            }}
          >
            <motion.button
              onClick={() => setFilterTag(null)}
              whileTap={{ scale: 0.96 }}
              style={{
                position: 'relative',
                padding: '4px 10px',
                border: 'none',
                borderRadius: '10px',
                background: 'transparent',
                color: !filterTag ? 'var(--primary-btn-fg, var(--cream))' : 'var(--stone)',
                fontWeight: !filterTag ? 600 : 500,
                cursor: 'pointer',
                fontSize: '0.73rem',
                fontFamily: 'inherit',
                zIndex: 1,
                flexShrink: 0,
                transition: 'color 180ms cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              {!filterTag && (
                <motion.div
                  layoutId="notes-filter-tag-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '10px',
                    background: 'var(--primary-btn-bg, var(--ink))',
                    boxShadow: '0 2px 6px var(--primary-btn-shadow, rgba(15, 23, 42, 0.12))',
                    zIndex: -1,
                  }}
                />
              )}
              Tout
            </motion.button>
            {Object.keys(tagColors).map(tag => {
              const isActive = filterTag === tag;
              const color = tagColors[tag];
              return (
                <motion.button
                  key={tag}
                  onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    position: 'relative',
                    padding: '4px 9px',
                    border: 'none',
                    borderRadius: '10px',
                    background: 'transparent',
                    color: isActive ? 'var(--primary-btn-fg, var(--cream))' : 'var(--stone)',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    fontSize: '0.73rem',
                    fontFamily: 'inherit',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    flexShrink: 0,
                    transition: 'color 180ms cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="notes-filter-tag-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '10px',
                        background: 'var(--primary-btn-bg, var(--ink))',
                        boxShadow: '0 2px 6px var(--primary-btn-shadow, rgba(15, 23, 42, 0.12))',
                        zIndex: -1,
                      }}
                    />
                  )}
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                      boxShadow: isActive ? `0 0 5px ${color}` : 'none',
                    }}
                  />
                  <span>{tag}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Notes list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--stone)', fontSize: '0.8rem' }}>Chargement…</div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.22, delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => setSelected(note)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    marginBottom: '6px',
                    cursor: 'pointer',
                    border: `1px solid ${selectedNote?.id === note.id ? 'var(--stone-light)' : 'transparent'}`,
                    background: selectedNote?.id === note.id ? 'var(--warm-white)' : 'transparent',
                    transition: 'border-color 0.15s cubic-bezier(0.23, 1, 0.32, 1), background 0.15s cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{
                      fontSize: '0.82rem', fontWeight: '500', color: 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      {note.pinned && (
                        <span style={{ color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                          <Pin size={13} style={{ fill: 'currentColor', transform: 'rotate(45deg)' }} />
                        </span>
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {note.title || 'Sans titre'}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--stone)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: '6px'
                  }}>
                    {note.content.replace(/<[^>]+>/g, '') || 'Vide…'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.65rem', padding: '1px 6px', borderRadius: '8px',
                      background: tagColors[note.tag] + '25', color: tagColors[note.tag],
                      border: `1px solid ${tagColors[note.tag]}50`
                    }}>{note.tag}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--stone-light)' }}>{timeAgo(note.updated_at)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <div style={{ 
              padding: '16px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              {/* Menu de sélection de catégorie avec indicateur glissant (sans encadrement) */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  position: 'relative',
                }}
              >
                {Object.entries(tagColors).map(([tag, color]) => {
                  const isSelected = selectedNote.tag === tag;
                  return (
                    <motion.button
                      key={tag}
                      onClick={() => handleUpdateNote('tag', tag)}
                      whileTap={{ scale: 0.96 }}
                      style={{
                        position: 'relative',
                        padding: '5px 12px',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.74rem',
                        fontFamily: 'inherit',
                        background: 'transparent',
                        color: isSelected ? 'var(--primary-btn-fg, var(--cream))' : 'var(--stone)',
                        fontWeight: isSelected ? 600 : 500,
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'color 180ms cubic-bezier(0.23, 1, 0.32, 1)',
                      }}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="note-editor-tag-pill"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '10px',
                            background: 'var(--primary-btn-bg, var(--ink))',
                            boxShadow: '0 2px 6px var(--primary-btn-shadow, rgba(15, 23, 42, 0.12))',
                            zIndex: -1,
                          }}
                        />
                      )}
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: color,
                          flexShrink: 0,
                          boxShadow: isSelected ? `0 0 6px ${color}` : 'none',
                          transition: 'box-shadow 0.2s ease',
                        }}
                      />
                      <span>{tag}</span>
                    </motion.button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button
                  onClick={() => togglePin(selectedNote.id)}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  title={selectedNote.pinned ? "Désépingler la note" : "Épingler la note"}
                  aria-label={selectedNote.pinned ? "Désépingler la note" : "Épingler la note"}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px 12px',
                    border: `1px solid ${selectedNote.pinned ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '12px',
                    background: selectedNote.pinned ? 'var(--gold-light)' : 'transparent',
                    cursor: 'pointer',
                    color: selectedNote.pinned ? 'var(--gold)' : 'var(--stone)',
                    transition: 'border-color 0.2s cubic-bezier(0.23, 1, 0.32, 1), background 0.2s cubic-bezier(0.23, 1, 0.32, 1), color 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
                  }}
                >
                  <Pin
                    size={15}
                    style={{
                      fill: selectedNote.pinned ? 'currentColor' : 'none',
                      transform: selectedNote.pinned ? 'rotate(45deg)' : 'none',
                      transition: 'transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
                    }}
                  />
                </motion.button>
                <motion.button
                  onClick={() => { deleteNote(selectedNote.id); setSelected(null); }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02, background: 'var(--priority-high-bg)' }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    padding: '6px 14px', border: '1px solid var(--border)', borderRadius: '12px',
                    background: 'transparent', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--priority-high)',
                    fontWeight: 500, fontFamily: 'inherit'
                  }}
                >
                  Supprimer
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
              <input
                value={selectedNote.title}
                onChange={e => handleUpdateNote('title', e.target.value)}
                placeholder="Titre de la note"
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  fontSize: '1.6rem', fontFamily: "'Nunito', sans-serif",
                  color: 'var(--ink)',
                  background: 'transparent', marginBottom: '20px',
                  fontWeight: '500'
                }}
              />
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                data-placeholder="Commencez à écrire…"
                style={{
                  width: '100%', minHeight: '400px', border: 'none', outline: 'none',
                  fontSize: '0.9rem', color: 'var(--ink-light)',
                  background: 'transparent',
                  lineHeight: '1.8', fontFamily: 'inherit', fontWeight: '300',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}
              />
              <FormatToolbar position={toolbarPos} isBold={formatState.bold} isUnderline={formatState.underline} onFormat={applyFormat} />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stone)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>◫</div>
              <div className="font-display" style={{ }}>Sélectionnez une note</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
