"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/** Thin brand progress bar pinned to the top of the page, driven by scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="brand-gradient fixed inset-x-0 top-0 z-50 h-[3px] origin-left"
      style={{ scaleX }}
    />
  );
}
