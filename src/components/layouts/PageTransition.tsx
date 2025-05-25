'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageTransition } from '@/utils/animationUtils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page transition component to wrap page content with animations
 */
export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={className}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
