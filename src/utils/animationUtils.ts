import { Variants } from 'framer-motion';

// Enhanced animation variants for better user engagement
export const fadeIn: Variants = {
  hidden: { 
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -30,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const fadeInLeft: Variants = {
  hidden: { 
    opacity: 0,
    x: -30,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const fadeInRight: Variants = {
  hidden: { 
    opacity: 0,
    x: 30,
    scale: 0.95
  },
  visible: { 
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const scaleIn: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
    rotate: -5
  },
  visible: { 
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      duration: 0.6
    }
  }
};

export const slideInFromBottom: Variants = {
  hidden: { 
    opacity: 0,
    y: 50,
    scale: 0.9
  },
  visible: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

export const bounceIn: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.3,
    rotate: -10
  },
  visible: { 
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 300,
      duration: 1.2
    }
  }
};

export const pulseAnimation: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const floatingAnimation: Variants = {
  float: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const shimmerAnimation: Variants = {
  shimmer: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Hover animations
export const hoverScale = {
  scale: 1.02,
  y: -2,
  transition: {
    duration: 0.2,
    ease: "easeOut"
  }
};

export const hoverGlow = {
  boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.1)",
  transition: {
    duration: 0.3,
    ease: "easeOut"
  }
};

// Progress bar animation
export const progressBarAnimation: Variants = {
  hidden: { width: 0 },
  visible: (width: number) => ({
    width: `${width}%`,
    transition: {
      duration: 1.5,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.5
    }
  })
};

// Card flip animation
export const cardFlip: Variants = {
  front: {
    rotateY: 0,
    transition: { duration: 0.6 }
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.6 }
  }
};

// Number counting animation
export const numberCount = (from: number, to: number, duration: number = 2) => ({
  from,
  to,
  transition: {
    duration,
    ease: "easeOut"
  }
});

// Particle system animation
export const particleFloat: Variants = {
  float: {
    y: [0, -20, 0],
    x: [0, 10, -10, 0],
    opacity: [0.3, 0.8, 0.3],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Loading spinner variants
export const spinnerVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Success checkmark animation
export const checkmarkVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.8, ease: "easeInOut" },
      opacity: { duration: 0.3 }
    }
  }
};

// Page transition animation
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};
