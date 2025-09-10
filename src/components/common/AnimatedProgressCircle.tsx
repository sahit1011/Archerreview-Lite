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

const AnimatedProgressCircle: React.FC<AnimatedProgressCircleProps> = ({
  percentage,
  size = 144,
  strokeWidth = 8,
  color = '#6366F1',
  backgroundColor = '#E5E7EB',
  showPercentage = true,
  label,
  duration = 2,
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

  const getColorByPercentage = (percent: number) => {
    if (percent >= 80) return '#10B981'; // Green
    if (percent >= 65) return '#F59E0B'; // Amber
    if (percent >= 50) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const dynamicColor = color === '#6366F1' ? getColorByPercentage(percentage) : color;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-20"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={dynamicColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay
          }}
          className="drop-shadow-sm"
        />
        
        {/* Glow effect */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={dynamicColor}
          strokeWidth={strokeWidth / 2}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference, opacity: 0 }}
          animate={{ 
            strokeDashoffset,
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay,
            opacity: {
              duration: duration * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className="blur-sm"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.div
            className="text-3xl font-bold"
            style={{ color: dynamicColor }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: delay + duration * 0.5,
              type: "spring",
              stiffness: 200
            }}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: delay + duration * 0.7 }}
            >
              {Math.round(animatedPercentage)}%
            </motion.span>
          </motion.div>
        )}
        
        {label && (
          <motion.div
            className="text-sm text-gray-500 mt-1 font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: delay + duration * 0.8
            }}
          >
            {label}
          </motion.div>
        )}
      </div>
      
      {/* Floating particles effect */}
      {percentage >= 80 && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-green-400 rounded-full opacity-60"
              style={{
                top: `${20 + i * 15}%`,
                left: `${80 + i * 5}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default AnimatedProgressCircle;