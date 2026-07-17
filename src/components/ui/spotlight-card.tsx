"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** spotlight tint, defaults to indigo */
  glow?: string;
}

/**
 * Card with a cursor-following radial spotlight, hover lift, and a gradient
 * hairline border that lights up on hover. The premium card used across the app.
 */
export function SpotlightCard({ className, children, glow = "rgba(99,102,241,0.14)", ...props }: SpotlightCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0, opacity: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos((p) => ({ ...p, opacity: 0 }))}
      className={cn(
        "group card-hover relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm",
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: pos.opacity,
          background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, ${glow}, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
