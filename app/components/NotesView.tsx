'use client';
import AddButton from './AddButton';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotes, Note } from '@/hooks/useNotes';
import FormatToolbar from './FormatToolbar';

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
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left panel */}
      <div style={{ 
        width: '260px', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--warm-white)'
      }}>
        {/* Search + Add */}
        <div style={{ padding: '20px 16px 12px' }}>
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
          {/* Tags filter */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button onClick={() => setFilterTag(null)} style={{
              padding: '3px 8px', borderRadius: '6px',
              border: '1px solid var(--border)',
              background: !filterTag ? 'var(--ink)' : 'transparent',
              color: !filterTag ? 'white' : 'var(--stone)',
              cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'inherit'
            }}>Tout</button>
            {Object.keys(tagColors).map(tag => (
              <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)} style={{
                padding: '3px 8px', borderRadius: '6px',
                border: `1px solid ${tagColors[tag]}`,
                background: filterTag === tag ? tagColors[tag] : 'transparent',
                color: filterTag === tag ? 'white' : 'var(--stone)',
                cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'inherit'
              }}>{tag}</button>
            ))}
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
                    <div style={{ fontSize: '0.82rem', fontWeight: '500', color: 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                    }}>
                      {note.pinned && <span style={{ color: 'var(--gold)', marginRight: '4px' }}>📌</span>}
                      {note.title || 'Sans titre'}
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
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {Object.entries(tagColors).map(([tag, color]) => (
                  <button key={tag} onClick={() => handleUpdateNote('tag', tag)} style={{
                    padding: '4px 10px', borderRadius: '6px',
                    border: `1px solid ${color}50`,
                    background: selectedNote.tag === tag ? color + '20' : 'transparent',
                    color: selectedNote.tag === tag ? color : 'var(--stone)',
                    cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'inherit',
                    fontWeight: selectedNote.tag === tag ? '500' : '300'
                  }}>{tag}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => togglePin(selectedNote.id)} style={{
                  padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '8px',
                  background: selectedNote.pinned ? 'var(--gold-light)' : 'transparent',
                  cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit', color: 'var(--stone)'
                }}>📌</button>
                <button onClick={() => { deleteNote(selectedNote.id); setSelected(null); }} style={{
                  padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '8px',
                  background: 'transparent', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--terra)'
                }}>Supprimer</button>
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
