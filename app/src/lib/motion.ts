/**
 * PodBrain Motion Presets — Kinetic Alabaster
 * Physics-based spring animations for purposeful motion.
 */

// Spring configurations
export const springs = {
  /** Snappy interactions — buttons, toggles, quick feedback */
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  /** Smooth entrances — page transitions, card reveals */
  smooth: { type: "spring" as const, stiffness: 200, damping: 25 },
  /** Gentle, content-aware — large panels, background elements */
  gentle: { type: "spring" as const, stiffness: 120, damping: 20 },
  /** Bouncy feedback — success states, playful elements */
  bouncy: { type: "spring" as const, stiffness: 300, damping: 15 },
}

// Duration tokens (for non-spring animations)
export const durations = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  enter: 0.5,
  exit: 0.2,
}

// Easing curves
export const easings = {
  outExpo: [0.19, 1, 0.22, 1] as const,
  outQuart: [0.25, 1, 0.5, 1] as const,
  inOutQuart: [0.76, 0, 0.24, 1] as const,
}

// Stagger children pattern
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
}

// Fade in
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.enter, ease: easings.outExpo },
  },
}

// Slide up entrance
export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
}

// Slide in from left
export const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
}

// Scale up entrance
export const scaleUp = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.snappy,
  },
}

// Page transition (for AnimatePresence)
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.enter, ease: easings.outExpo },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: durations.exit },
  },
}
