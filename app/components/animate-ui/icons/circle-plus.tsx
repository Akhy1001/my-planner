'use client';

/**
 * CirclePlus — Animated icon (animate-ui style)
 * Uses Motion (motion/react) to animate Lucide's CirclePlus SVG paths.
 *
 * Animations:
 *  - hover  : the circle does a spring scale-pulse, the + lines draw from center outward
 *  - tap    : quick scale-down spring (tactile feedback)
 */

import { motion, type Variants } from 'motion/react';
import { useCallback, useState } from 'react';

// ── Variant definitions ──────────────────────────────────────────

const circleVariants: Variants = {
  normal:  { scale: 1 },
  animate: {
    scale: [1, 1.12, 0.96, 1.04, 1],
    transition: { duration: 0.5, type: 'spring', stiffness: 300, damping: 15 },
  },
};

const hLineVariants: Variants = {
  normal:  { d: 'M8 12h8',  opacity: 1 },
  animate: {
    d:  ['M12 12h0', 'M8 12h8'],
    opacity: [0.4, 1],
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

const vLineVariants: Variants = {
  normal:  { d: 'M12 8v8',  opacity: 1 },
  animate: {
    d:  ['M12 12v0', 'M12 8v8'],
    opacity: [0.4, 1],
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.04 },
  },
};

// ── Component ────────────────────────────────────────────────────

interface CirclePlusProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function CirclePlus({
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
}: CirclePlusProps) {
  const [state, setState] = useState<'normal' | 'animate'>('normal');

  const onHoverStart = useCallback(() => setState('animate'), []);
  const onHoverEnd   = useCallback(() => setState('normal'),  []);

  return (
    <motion.div
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        variants={circleVariants}
        animate={state}
      >
        <circle cx="12" cy="12" r="10" />
        <motion.path variants={hLineVariants} animate={state} />
        <motion.path variants={vLineVariants} animate={state} />
      </motion.svg>
    </motion.div>
  );
}
