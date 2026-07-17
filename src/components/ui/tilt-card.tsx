"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Perspective tilt that follows the pointer — real 3D depth, spring-smoothed.
 * Children marked with [data-depth] float on their own z-plane.
 * No-ops for touch/reduced-motion users (falls back to a static card).
 */
export function TiltCard({
  children,
  className,
  maxTilt = 7,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), {
    stiffness: 260,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), {
    stiffness: 260,
    damping: 24,
  });

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };
  const onPointerLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        className={cn("[transform-style:preserve-3d]", className)}
        style={reduce ? undefined : { rotateX, rotateY }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {children}
      </motion.div>
    </div>
  );
}
