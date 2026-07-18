"use client";

import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      {/* Avatar glyph — matches the AI message grammar */}
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/12 text-primary">
        <SparklesIcon className="h-4 w-4" />
      </div>

      <div className="flex flex-col items-start">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            AI Tutor
          </span>
          <span className="font-mono text-[0.65rem] text-muted-foreground/70">typing…</span>
        </div>

        {/* Typing loader — kept as a legit progress indicator */}
        <div className="inline-flex items-center rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex gap-1.5">
            {[0, 0.2, 0.4].map((delay) => (
              <motion.div
                key={delay}
                animate={{ scale: [1, 1.25, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay }}
                className="h-2 w-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
