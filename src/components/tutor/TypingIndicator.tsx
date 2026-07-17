"use client";

import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function TypingIndicator() {
  return (
    <div className="mb-8">
      {/* Message header with avatar and role */}
      <div className="flex items-center mb-3">
        <div className="flex-shrink-0 h-9 w-9 rounded-xl mr-3 flex items-center justify-center shadow-sm bg-primary/15">
          <SparklesIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm font-semibold text-foreground">
          AI Tutor
        </div>
      </div>

      {/* Typing indicator */}
      <div className="pl-12">
        <div className="inline-flex items-center bg-card border border-border px-5 py-3 rounded-2xl rounded-bl-md shadow-sm">
          <div className="flex space-x-2">
            {[0, 0.2, 0.4].map((delay) => (
              <motion.div
                key={delay}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay
                }}
                className="w-2.5 h-2.5 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
