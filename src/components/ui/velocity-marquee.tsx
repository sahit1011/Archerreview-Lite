"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useReducedMotion,
} from "framer-motion";

function wrap(min: number, max: number, v: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

/**
 * Marquee that reacts to scrolling: cruises slowly on its own, accelerates with
 * scroll velocity, and reverses direction when the user scrolls up. The page
 * physically responds to the reader instead of looping obliviously.
 */
export function VelocityMarquee({
  children,
  baseVelocity = 2.2,
  className,
}: {
  children: React.ReactNode;
  baseVelocity?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [-1200, 0, 1200], [-4, 0, 4], {
    clamp: false,
  });

  const directionRef = useRef(1);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let moveBy = directionRef.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) directionRef.current = -1;
    else if (vf > 0) directionRef.current = 1;
    moveBy += directionRef.current * moveBy * Math.abs(vf);
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className={className}>
      <motion.div className="flex w-max gap-8" style={reduce ? undefined : { x }}>
        {/* four copies so the 25% wrap window never shows a gap */}
        {[0, 1, 2, 3].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-8" aria-hidden={copy > 0}>
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
