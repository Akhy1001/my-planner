'use client';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FormatToolbarProps {
  position: { top: number; left: number } | null;
  isBold?: boolean;
  isUnderline?: boolean;
  onFormat: (command: string, value?: string) => void;
}

const HIGHLIGHT_COLORS = [
  { label: 'Jaune', value: '#FEF08A' },
  { label: 'Vert', value: '#BBF7D0' },
  { label: 'Rose', value: '#FBCFE8' },
  { label: 'Bleu', value: '#BAE6FD' },
  { label: 'Orange', value: '#FED7AA' },
  { label: 'Violet', value: '#E9D5FF' },
];

export default function FormatToolbar({ position, isBold = false, isUnderline = false, onFormat }: FormatToolbarProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Empêche la perte de sélection au clic sur la toolbar
    e.preventDefault();
  };

  return (
    <AnimatePresence>
      {position && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          onMouseDown={handleMouseDown}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'var(--ink)',
            borderRadius: '10px',
            padding: '6px 8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          {/* Gras */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onFormat('bold')}
            title={isBold ? 'Retirer le gras' : 'Gras'}
            style={{
              width: '30px', height: '30px', borderRadius: '6px',
              border: 'none',
              background: isBold ? 'rgba(128,128,128,0.3)' : 'transparent',
              color: 'var(--cream)', cursor: 'pointer',
              fontWeight: '700', fontSize: '0.85rem', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(128,128,128,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isBold ? 'rgba(128,128,128,0.3)' : 'transparent'; }}
          >
            B
          </motion.button>

          {/* Souligné */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onFormat('underline')}
            title={isUnderline ? 'Retirer le soulignage' : 'Souligné'}
            style={{
              width: '30px', height: '30px', borderRadius: '6px',
              border: 'none',
              background: isUnderline ? 'rgba(128,128,128,0.3)' : 'transparent',
              color: 'var(--cream)', cursor: 'pointer',
              fontSize: '0.85rem', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'underline',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(128,128,128,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isUnderline ? 'rgba(128,128,128,0.3)' : 'transparent'; }}
          >
            U
          </motion.button>

          {/* Séparateur */}
          <div style={{ width: '1px', height: '18px', background: 'rgba(128,128,128,0.25)', margin: '0 4px' }} />

          {/* Couleurs de surlignage prédéfinies */}
          {HIGHLIGHT_COLORS.map(({ label, value }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.88 }}
              onClick={() => onFormat('hiliteColor', value)}
              title={`Surligner en ${label}`}
              style={{
                width: '18px', height: '18px', borderRadius: '4px',
                border: '1.5px solid rgba(128,128,128,0.35)',
                background: value, cursor: 'pointer',
                flexShrink: 0,
              }}
            />
          ))}

          {/* Effacer le surlignage */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => onFormat('hiliteColor', 'transparent')}
            title="Enlever le surlignage"
            style={{
              width: '18px', height: '18px', borderRadius: '4px',
              border: '1.5px solid rgba(128,128,128,0.35)',
              background: 'transparent', cursor: 'pointer',
              flexShrink: 0, position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom right, transparent calc(50% - 0.75px), rgba(255,100,80,0.9) calc(50% - 0.75px), rgba(255,100,80,0.9) calc(50% + 0.75px), transparent calc(50% + 0.75px))',
            }} />
          </motion.button>

          {/* Séparateur */}
          <div style={{ width: '1px', height: '18px', background: 'rgba(128,128,128,0.25)', margin: '0 4px' }} />

          {/* Color picker libre */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => colorInputRef.current?.click()}
            title="Couleur personnalisée"
            style={{
              width: '30px', height: '30px', borderRadius: '6px',
              border: 'none', background: 'transparent',
              color: 'var(--cream)', cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(128,128,128,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            🎨
          </motion.button>
          <input
            ref={colorInputRef}
            type="color"
            defaultValue="#FBBF24"
            onChange={e => onFormat('hiliteColor', e.target.value)}
            style={{ width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
