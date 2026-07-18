"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @deprecated retained for call-site compatibility; no longer rendered. */
  glow?: string;
}

/**
 * The premium card used across the app: a clean bg-card surface, hairline border,
 * and a restrained hover lift (.card-hover). The original cursor-following radial
 * "spotlight" overlay was decorative motion that conveyed no state, so it was
 * removed; the quiet neutral elevation now carries the hover affordance.
 */
export function SpotlightCard({ className, children, glow, ...props }: SpotlightCardProps) {
  void glow;
  return (
    <div
      className={cn(
        "group card-hover relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
