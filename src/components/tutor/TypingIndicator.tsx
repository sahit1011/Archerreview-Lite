"use client";

import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function TypingIndicator() {
  return (
    <div className="mb-8">
      {/* Message header with avatar and role */}
      <div className="flex items-center mb-3">
        <div className="flex-shrink-0 h-9 w-9 rounded-full mr-3 flex items-center justify-center shadow-card" style={{ backgroundColor: 'rgba(66, 176, 232, 0.2)' }}>
          <SparklesIcon className="h-5 w-5 text-archer-light-blue" />
        </div>
        <div className="text-sm font-semibold text-white">
          AI Tutor
        </div>
      </div>

      {/* Typing indicator */}
      <div className="pl-12">
        <div className="inline-flex items-center bg-card-background-darker px-5 py-3 rounded-xl shadow-card">
          <div className="flex space-x-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: 0
              }}
              className="w-2.5 h-2.5 rounded-full bg-archer-bright-teal"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: 0.2
              }}
              className="w-2.5 h-2.5 rounded-full bg-archer-bright-teal"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: 0.4
              }}
              className="w-2.5 h-2.5 rounded-full bg-archer-bright-teal"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
