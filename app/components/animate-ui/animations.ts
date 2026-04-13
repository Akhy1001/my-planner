import { type Variants } from 'motion/react';

/**
 * Animations réutilisables pour la bibliothèque animate-ui
 */

// Spin/Rotate
export const spinVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: 'linear' },
  },
};

// Pulse scale
export const pulseVariants: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: { duration: 0.6, repeat: Infinity },
  },
};

// Bounce
export const bounceVariants: Variants = {
  normal: { y: 0 },
  animate: {
    y: [0, -6, 0],
    transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
  },
};

// Fade in/out
export const fadeVariants: Variants = {
  normal: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
};

// Scale entrance
export const scaleEnterVariants: Variants = {
  normal: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, type: 'spring', stiffness: 300, damping: 30 },
  },
};

// Shake
export const shakeVariants: Variants = {
  normal: { x: 0 },
  animate: {
    x: [-4, 4, -4, 4, 0],
    transition: { duration: 0.4 },
  },
};

// Wiggle
export const wiggleVariants: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: [-2, 2, -2, 2, 0],
    transition: { duration: 0.5 },
  },
};

// Heartbeat
export const heartbeatVariants: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.5 },
  },
};

// Slide in from left
export const slideInLeftVariants: Variants = {
  normal: { x: -20, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

// Slide in from right
export const slideInRightVariants: Variants = {
  normal: { x: 20, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

// Rotate on hover
export const rotateHoverVariants: Variants = {
  normal: { rotate: 0 },
  hover: { rotate: 360, transition: { duration: 0.4 } },
};

// Glow/Shadow
export const glowVariants: Variants = {
  normal: { filter: 'drop-shadow(0px 0px 0px rgba(0,0,0,0))' },
  animate: {
    filter: 'drop-shadow(0px 0px 8px rgba(192,99,74,0.3))',
    transition: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' },
  },
};
