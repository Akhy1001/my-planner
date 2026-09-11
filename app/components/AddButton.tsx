'use client';

import { motion } from 'motion/react';
import { CirclePlus } from './animate-ui';

interface AddButtonProps {
  onClick: () => void;
  label?: string;
  size?: number;
}

/**
 * AddButton — bouton + animé réutilisable dans toutes les vues
 * Utilise l'icône CirclePlus animate-ui (Motion).
 */
export default function AddButton({ onClick, label, size = 20 }: AddButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      title={label ?? 'Ajouter'}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: label ? '8px 16px 8px 12px' : '9px 12px',
        background: 'var(--primary-btn-bg, var(--ink))',
        color: 'var(--primary-btn-fg, var(--cream))',
        border: 'none',
        borderRadius: '14px',
        cursor: 'pointer',
        fontSize: '0.84rem',
        fontFamily: 'inherit',
        fontWeight: '600',
        letterSpacing: '0.01em',
        boxShadow: '0 2px 8px var(--primary-btn-shadow, rgba(15,23,42,0.12))',
        transition: 'background 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--primary-btn-hover, var(--ink-light))';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--primary-btn-bg, var(--ink))';
      }}
    >
      <CirclePlus size={size} color="var(--primary-btn-fg, var(--cream))" className="" />
      {label && <span>{label}</span>}
    </motion.button>
  );
}
