'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cardHover } from '@/utils/animationUtils';
import { useAnimateInView } from '@/hooks/useAnimation';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  delay?: number;
  animate?: boolean;
}

export default function AnimatedCard({
  children,
  className = '',
  interactive = false,
  onClick,
  delay = 0,
  animate = true,
}: AnimatedCardProps) {
  const { ref, shouldAnimate } = useAnimateInView({ delay });

  // Base styles - removed bg-white to allow custom backgrounds
  const baseStyles = 'rounded-lg overflow-hidden';

  // Interactive styles
  const interactiveStyles = interactive ? 'cursor-pointer' : '';

  // Combined styles
  const combinedStyles = `${baseStyles} ${interactiveStyles} ${className}`;

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={combinedStyles}
      initial={animate ? "hidden" : "visible"}
      animate={shouldAnimate ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            delay: delay,
            ease: [0.25, 0.1, 0.25, 1.0]
          }
        }
      }}
      whileHover={interactive ? "hover" : undefined}
      variants={interactive ? cardHover : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
