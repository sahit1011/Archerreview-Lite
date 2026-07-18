import { Variants } from 'framer-motion';

/**
 * Shared motion variants. De-vibecoded: entrances fade + translate only (no
 * scale/rotate pop), the perpetual loops (pulse/float/shimmer/particle) are
 * neutralized to static no-ops, and hover helpers drop the colored glow +
 * scale. Legit one-shot/loader variants (progress, checkmark, spinner) kept.
 * Every export is preserved so existing import sites keep working.
 */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } }
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } }
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } }
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_OUT } }
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_OUT } }
};

// Subtle fade (was scale 0.8 + rotate -5 — a pop-in gimmick).
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1, duration: 0.5 }
  }
};

export const slideInFromBottom: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } }
};

// Was a spring bounce (scale 0.3 + rotate). Now a calm fade-up, matching Reveal.
export const bounceIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } }
};

// Retired perpetual loops — kept as no-op variants so animate="pulse|float|shimmer"
// call sites stay valid but produce no motion.
export const pulseAnimation: Variants = { pulse: {} };
export const floatingAnimation: Variants = { float: {} };
export const shimmerAnimation: Variants = { shimmer: {} };
export const particleFloat: Variants = { float: {} };

// Hover helpers — quiet lift + neutral elevation (was scale 1.02 + colored glow).
export const hoverScale = {
  y: -2,
  transition: { duration: 0.2, ease: "easeOut" }
};

export const hoverGlow = {
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.10), 0 12px 32px -16px rgba(15, 23, 42, 0.18)",
  transition: { duration: 0.25, ease: "easeOut" }
};

// One-shot progress fill (legit).
export const progressBarAnimation: Variants = {
  hidden: { width: 0 },
  visible: (width: number) => ({
    width: `${width}%`,
    transition: { duration: 1.2, ease: EASE_OUT, delay: 0.3 }
  })
};

export const cardFlip: Variants = {
  front: { rotateY: 0, transition: { duration: 0.6 } },
  back: { rotateY: 180, transition: { duration: 0.6 } }
};

export const numberCount = (from: number, to: number, duration: number = 2) => ({
  from,
  to,
  transition: { duration, ease: "easeOut" }
});

// Loading spinner (legit loader — kept).
export const spinnerVariants: Variants = {
  spin: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" }
  }
};

// Success checkmark draw-in (legit one-shot — kept).
export const checkmarkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.8, ease: "easeInOut" },
      opacity: { duration: 0.3 }
    }
  }
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.35, ease: EASE_OUT } }
};
