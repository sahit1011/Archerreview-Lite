'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/utils/animationUtils';
import { useStaggeredAnimation } from '@/hooks/useAnimation';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  as?: 'ul' | 'ol' | 'div';
  staggerDelay?: number;
  initialDelay?: number;
}

export default function AnimatedList({
  children,
  className = '',
  itemClassName = '',
  as = 'ul',
  staggerDelay = 0.05,
  initialDelay = 0,
}: AnimatedListProps) {
  const { containerRef, isInView, getAnimationDelay } = useStaggeredAnimation(
    React.Children.count(children),
    { staggerDelay, initialDelay }
  );
  
  // Create the container element based on the 'as' prop
  const Container = motion[as];
  
  return (
    <Container
      ref={containerRef as React.RefObject<HTMLElement>}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
    >
      {React.Children.map(children, (child, index) => (
        <motion.li
          className={itemClassName}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { 
                duration: 0.3,
                delay: getAnimationDelay(index)
              }
            }
          }}
        >
          {child}
        </motion.li>
      ))}
    </Container>
  );
}
