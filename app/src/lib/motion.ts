/**
 * Motion Design Tokens - Kinetic Alabaster
 * Spring presets, duration scale, and easing curves for Motion animations
 */

export type SpringConfig = {
  type: "spring";
  stiffness: number;
  damping: number;
};

export type SpringPreset = "snappy" | "smooth" | "gentle" | "bouncy";

export const springs: Record<SpringPreset, SpringConfig> = {
  // Snappy interactions (buttons, toggles)
  snappy: { type: "spring", stiffness: 400, damping: 30 },

  // Smooth entrances (page transitions, modals)
  smooth: { type: "spring", stiffness: 200, damping: 25 },

  // Gentle, content-aware (cards, lists)
  gentle: { type: "spring", stiffness: 120, damping: 20 },

  // Bouncy feedback (confirmations, success states)
  bouncy: { type: "spring", stiffness: 300, damping: 15 },
};

export const durations = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  enter: 0.5,
  exit: 0.2,
};

export const easings = {
  outExpo: [0.19, 1, 0.22, 1] as const,
  outQuart: [0.25, 1, 0.5, 1] as const,
  inOutQuart: [0.76, 0, 0.24, 1] as const,
};
