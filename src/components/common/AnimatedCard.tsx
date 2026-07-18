"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn, hoverScale, hoverGlow } from '@/utils/animationUtils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  gradient?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  delay = 0,
  hover = true,
  glow = false,
  onClick,
  gradient = false
}) => {
  // Clean bg-card surface (was a from-white/10 glass gradient — off-system).
  // hoverScale/hoverGlow are now a quiet lift + neutral elevation (see animationUtils).
  const baseClasses = `
    dashboard-card rounded-xl
    ${gradient ? 'bg-secondary/40' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  const hoverEffects = hover ? {
    whileHover: glow ? { ...hoverScale, ...hoverGlow } : hoverScale,
    whileTap: { scale: 0.98 }
  } : {};

  return (
    <motion.div
      className={baseClasses}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ delay }}
      onClick={onClick}
      {...hoverEffects}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
