"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  duration?: number;
  delay?: number;
}

/**
 * Readiness/progress ring: a single stroke that draws in once on mount. The
 * pulsing glow ring, the >=80% "floating particles", the spring pop on the
 * number, and the green/amber/red multi-hue thresholds were all decorative
 * noise — removed. One quiet primary accent, one one-shot fill.
 */
const AnimatedProgressCircle: React.FC<AnimatedProgressCircleProps> = ({
  percentage,
  size = 144,
  strokeWidth = 8,
  color = 'var(--primary)',
  backgroundColor = 'var(--border)',
  showPercentage = true,
  label,
  duration = 1.1,
  delay = 0
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-40"
        />

        {/* Progress ring — draws in once */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration,
            ease: [0.22, 1, 0.36, 1],
            delay
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.div
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: delay + duration * 0.5 }}
          >
            {Math.round(animatedPercentage)}%
          </motion.div>
        )}

        {label && (
          <motion.div
            className="text-sm text-muted-foreground mt-1 font-medium"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay + duration * 0.6 }}
          >
            {label}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnimatedProgressCircle;
