'use client';
import { motion } from 'motion/react';

interface ScribbleStrikethroughProps {
  active: boolean;
  color?: string;
  strokeWidth?: number;
}

/**
 * Effet de rature gribouillée — SVG animé qui simule un trait manuscrit irrégulier.
 * À placer en enfant d'un élément `position: relative`.
 */
export function ScribbleStrikethrough({
  active,
  color = 'currentColor',
  strokeWidth = 2.2,
}: ScribbleStrikethroughProps) {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '100%',
        height: '14px',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
      viewBox="0 0 100 14"
      preserveAspectRatio="none"
    >
      {/* Trait principal — large amplitude */}
      <motion.path
        d="M0,7 C6,2.5 13,11 22,5.5 C31,0 38,10.5 48,6 C58,1.5 65,11 75,5 C84,0 91,10 100,6.5"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          active
            ? { pathLength: 1, opacity: 0.85 }
            : { pathLength: 0, opacity: 0 }
        }
        transition={{
          pathLength: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.08 },
        }}
      />
      {/* Second trait décalé — renforce l'effet gribouillé */}
      <motion.path
        d="M2,9 C10,5 18,12 28,7.5 C38,3 45,11.5 55,8 C65,4.5 72,12 82,7 C90,3 96,9.5 100,8"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth * 0.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          active
            ? { pathLength: 1, opacity: 0.5 }
            : { pathLength: 0, opacity: 0 }
        }
        transition={{
          pathLength: { duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: 0.08 },
          opacity: { duration: 0.08, delay: 0.08 },
        }}
      />
    </svg>
  );
}
