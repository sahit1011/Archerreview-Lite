/**
 * Custom hook for managing animations with performance optimizations
 */
import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface AnimationOptions {
  threshold?: number;
  once?: boolean;
  delay?: number;
  rootMargin?: string;
}

/**
 * Hook for triggering animations when elements come into view
 */
export function useAnimateInView(options: AnimationOptions = {}) {
  const { 
    threshold = 0.1, 
    once = true, 
    delay = 0,
    rootMargin = "0px" 
  } = options;
  
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { 
    once, 
    amount: threshold,
    margin: rootMargin
  });
  
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, delay * 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (!once && !isInView) {
      setShouldAnimate(false);
    }
  }, [isInView, delay, once]);
  
  return { ref, shouldAnimate, isInView };
}

/**
 * Hook for managing staggered animations for lists
 */
export function useStaggeredAnimation(itemCount: number, options: { 
  baseDelay?: number;
  staggerDelay?: number;
  initialDelay?: number;
} = {}) {
  const { 
    baseDelay = 0.1, 
    staggerDelay = 0.05,
    initialDelay = 0
  } = options;
  
  const getAnimationDelay = useCallback((index: number) => {
    return initialDelay + baseDelay + (index * staggerDelay);
  }, [baseDelay, staggerDelay, initialDelay]);
  
  const containerRef = useRef<HTMLElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });
  
  return { containerRef, isInView, getAnimationDelay };
}

/**
 * Hook for managing loading state animations
 */
export function useLoadingAnimation(isLoading: boolean, options: {
  minDuration?: number;
} = {}) {
  const { minDuration = 500 } = options;
  const [showLoading, setShowLoading] = useState(isLoading);
  
  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
    } else {
      // Ensure loading animation shows for at least minDuration
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, minDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, minDuration]);
  
  return { showLoading };
}

/**
 * Hook for managing hover animations
 */
export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  return {
    isHovered,
    hoverHandlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave
    }
  };
}

/**
 * Hook for managing click/tap animations
 */
export function useTapAnimation() {
  const [isTapped, setIsTapped] = useState(false);
  
  const handleTapStart = useCallback(() => {
    setIsTapped(true);
  }, []);
  
  const handleTapEnd = useCallback(() => {
    setIsTapped(false);
  }, []);
  
  return {
    isTapped,
    tapHandlers: {
      onTapStart: handleTapStart,
      onTap: handleTapEnd,
      onTapCancel: handleTapEnd
    }
  };
}
