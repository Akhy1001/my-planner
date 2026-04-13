'use client';

import { motion, type Variants } from 'motion/react';
import { useState } from 'react';

/** CirclePlus — Animated plus icon in circle */
export function CirclePlus({
  size = 24,
  color = 'var(--ink)',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const circleVariants: Variants = {
    normal: { scale: 1 },
    animate: {
      scale: [1, 1.12, 0.96, 1.04, 1],
      transition: { duration: 0.5, type: 'spring', stiffness: 300, damping: 15 },
    },
  };

  const hLineVariants: Variants = {
    normal: { d: 'M8 12h8', opacity: 1 },
    animate: {
      d: ['M12 12h0', 'M8 12h8'],
      opacity: [0.4, 1],
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const vLineVariants: Variants = {
    normal: { d: 'M12 8v8', opacity: 1 },
    animate: {
      d: ['M12 12v0', 'M12 8v8'],
      opacity: [0.4, 1],
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.04 },
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <motion.circle cx="12" cy="12" r="10" variants={circleVariants} animate={isAnimating ? 'animate' : 'normal'} />
      <motion.path d="M8 12h8" variants={hLineVariants} animate={isAnimating ? 'animate' : 'normal'} />
      <motion.path d="M12 8v8" variants={vLineVariants} animate={isAnimating ? 'animate' : 'normal'} />
    </motion.svg>
  );
}

/** CheckCircle — Animated checkmark icon */
export function CheckCircle({ 
  size = 24, 
  color = 'var(--sage)', 
  className = '' 
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const circleVariants: Variants = {
    normal: { scale: 1 },
    animate: { scale: 1.1, transition: { duration: 0.3 } },
  };

  const checkVariants: Variants = {
    normal: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        variants={circleVariants}
        animate={isAnimating ? 'animate' : 'normal'}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        variants={checkVariants}
        animate={isAnimating ? 'animate' : 'normal'}
      />
    </motion.svg>
  );
}

/** Trash — Animated trash icon */
export function Trash({
  size = 24,
  color = 'var(--terra)',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const lidVariants: Variants = {
    normal: { y: 0, rotate: 0 },
    animate: { y: -4, rotate: -5, transition: { duration: 0.3 } },
  };

  const canVariants: Variants = {
    normal: { scaleY: 1 },
    animate: { scaleY: 0.8, transition: { duration: 0.3 } },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <motion.polyline
        points="3 6 5 6 21 6"
        variants={lidVariants}
        animate={isAnimating ? 'animate' : 'normal'}
      />
      <motion.path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"
        variants={canVariants}
        animate={isAnimating ? 'animate' : 'normal'}
      />
    </motion.svg>
  );
}

/** Edit — Animated edit/pencil icon */
export function Edit({
  size = 24,
  color = 'var(--gold)',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const pencilVariants: Variants = {
    normal: { rotate: 0 },
    animate: { rotate: 10, transition: { duration: 0.3 } },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <motion.path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        variants={pencilVariants}
        animate={isAnimating ? 'animate' : 'normal'}
      />
      <motion.path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        variants={pencilVariants}
        animate={isAnimating ? 'animate' : 'normal'}
      />
    </motion.svg>
  );
}

/** Calendar — Animated calendar icon */
export function Calendar({
  size = 24,
  color = 'var(--sage)',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const dotVariants: Variants = {
    normal: { scale: 1, opacity: 0.5 },
    animate: { scale: 1.2, opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <motion.rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <motion.line x1="16" y1="2" x2="16" y2="6" />
      <motion.line x1="8" y1="2" x2="8" y2="6" />
      <motion.line x1="3" y1="10" x2="21" y2="10" />
      <motion.circle
        cx="9"
        cy="15"
        r="1"
        variants={dotVariants}
        animate={isAnimating ? 'animate' : 'normal'}
      />
      <motion.circle cx="14" cy="15" r="1" />
      <motion.circle cx="19" cy="15" r="1" />
    </motion.svg>
  );
}

/** Heart — Animated heart icon */
export function Heart({
  size = 24,
  color = 'var(--terra)',
  className = '',
  filled = false,
}: {
  size?: number;
  color?: string;
  className?: string;
  filled?: boolean;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const heartVariants: Variants = {
    normal: { scale: 1 },
    animate: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      variants={heartVariants}
      animate={isAnimating ? 'animate' : 'normal'}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </motion.svg>
  );
}

/** Star — Animated star icon */
export function Star({
  size = 24,
  color = 'var(--gold)',
  className = '',
  filled = false,
}: {
  size?: number;
  color?: string;
  className?: string;
  filled?: boolean;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const starVariants: Variants = {
    normal: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: { duration: 0.6 },
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      variants={starVariants}
      animate={isAnimating ? 'animate' : 'normal'}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <polygon points="12 2 15.09 10.26 24 10.27 17.18 16.7 20.27 24.96 12 18.54 3.73 24.96 6.82 16.7 0 10.27 8.91 10.26 12 2" />
    </motion.svg>
  );
}

/** Target — Animated target icon */
export function Target({
  size = 24,
  color = 'var(--terra)',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const circle1Variants: Variants = {
    normal: { scale: 1 },
    animate: { scale: 1.1, transition: { duration: 0.3 } },
  };

  const circle2Variants: Variants = {
    normal: { scale: 1 },
    animate: { scale: 0.9, transition: { duration: 0.3 } },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <motion.circle cx="12" cy="12" r="1" variants={circle1Variants} animate={isAnimating ? 'animate' : 'normal'} />
      <motion.circle cx="12" cy="12" r="5" variants={circle2Variants} animate={isAnimating ? 'animate' : 'normal'} />
      <motion.circle cx="12" cy="12" r="9" />
    </motion.svg>
  );
}

/** Zap — Animated lightning/speed icon */
export function Zap({
  size = 24,
  color = 'var(--gold)',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const zapVariants: Variants = {
    normal: { opacity: 1 },
    animate: {
      opacity: [1, 0.5, 1],
      transition: { duration: 0.6, repeat: Infinity },
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      variants={zapVariants}
      animate={isAnimating ? 'animate' : 'normal'}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </motion.svg>
  );
}

/** Flag — Animated flag icon */
export function Flag({
  size = 24,
  color = 'var(--terra)',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const flagVariants: Variants = {
    normal: { y: 0 },
    animate: {
      y: [0, -4, 0],
      transition: { duration: 0.6, repeat: Infinity },
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
      onMouseEnter={() => setIsAnimating(true)}
      onMouseLeave={() => setIsAnimating(false)}
    >
      <motion.path
        d="M4 15s1-1 5-1 5 2 10 0V4s-1 1-5 1-5-2-10 0"
        variants={flagVariants}
        animate={isAnimating ? 'animate' : 'normal'}
      />
      <motion.path d="M4 21v-7" />
    </motion.svg>
  );
}
