'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  animate?: boolean;
}

export default function Skeleton({
  className = '',
  width,
  height,
  circle = false,
  animate = true,
}: SkeletonProps) {
  // Base styles
  const baseStyles = 'bg-gray-200 animate-pulse';
  
  // Shape styles
  const shapeStyles = circle ? 'rounded-full' : 'rounded';
  
  // Combined styles
  const combinedStyles = `${baseStyles} ${shapeStyles} ${className}`;
  
  // Inline styles for width and height
  const inlineStyles: React.CSSProperties = {
    width: width,
    height: height,
  };
  
  if (animate) {
    return (
      <motion.div
        className={combinedStyles}
        style={inlineStyles}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    );
  }
  
  return <div className={combinedStyles} style={inlineStyles} />;
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lineClassName?: string;
  width?: string | number;
  animate?: boolean;
}

export function SkeletonText({
  lines = 3,
  className = '',
  lineClassName = '',
  width = '100%',
  animate = true,
}: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={lineClassName}
          width={typeof width === 'number' || typeof width === 'string' ? width : `${width}%`}
          height={16}
          animate={animate}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  headerHeight?: number;
  contentLines?: number;
  animate?: boolean;
}

export function SkeletonCard({
  className = '',
  headerHeight = 24,
  contentLines = 3,
  animate = true,
}: SkeletonCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <Skeleton height={headerHeight} className="mb-4" animate={animate} />
      <SkeletonText lines={contentLines} animate={animate} />
    </div>
  );
}
