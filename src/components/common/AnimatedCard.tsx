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
  const baseClasses = `
    dashboard-card rounded-xl
    ${gradient ? 'bg-gradient-to-br from-white/95 to-white/85' : ''}
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
