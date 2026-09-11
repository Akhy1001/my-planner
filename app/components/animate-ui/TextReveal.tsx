'use client';

import React from 'react';
import { motion } from 'motion/react';

interface TextRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'span' | 'p';
}

/**
 * TextReveal — Dévoilement Masqué Élégant (Linear / Apple style)
 * Découpe le texte avec overflow:hidden et le fait glisser de bas en haut
 * de manière nette, précise et ultra-fluide.
 */
export function TextReveal({
  children,
  delay = 0,
  duration = 0.55,
  className = '',
  style = {},
  as = 'div',
}: TextRevealProps) {
  const displayStyle = style.display ?? (as === 'span' ? 'inline-block' : 'block');
  const isInline = displayStyle === 'inline-block' || displayStyle === 'inline-flex' || displayStyle === 'inline' || as === 'span';
  const MotionTag = motion[as] as React.ComponentType<any>;

  return (
    <span
      style={{
        display: isInline ? 'inline-block' : 'block',
        overflow: 'hidden',
        verticalAlign: 'bottom',
        lineHeight: style.lineHeight ?? 'inherit',
      }}
    >
      <MotionTag
        initial={{ y: '110%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={className}
        style={{
          ...style,
          display: displayStyle,
          margin: 0,
        }}
      >
        {children}
      </MotionTag>
    </span>
  );
}

export default TextReveal;
