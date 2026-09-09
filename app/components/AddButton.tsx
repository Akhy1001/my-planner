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
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: label ? '7px 14px 7px 10px' : '8px',
        background: 'var(--ink)',
        color: 'var(--cream)',
        border: 'none',
        borderRadius: 'var(--radius-md, 8px)',
        cursor: 'pointer',
        fontSize: '0.82rem',
        fontFamily: 'inherit',
        fontWeight: '600',
        letterSpacing: '0.01em',
        boxShadow: '0 2px 6px rgba(15,23,42,0.12)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--ink-light)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--ink)';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(15,23,42,0.12)';
      }}
    >
      <CirclePlus size={size} color="var(--cream)" className="" />
      {label && <span>{label}</span>}
    </motion.button>
  );
}
