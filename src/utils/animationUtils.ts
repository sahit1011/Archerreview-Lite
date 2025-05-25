/**
 * Animation utility functions and variants for consistent animations across the application
 */
import { Variants } from 'framer-motion';

// Common animation variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0] 
    }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { 
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0] 
    }
  }
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0] 
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { 
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0] 
    }
  }
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0] 
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { 
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0] 
    }
  }
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0] 
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { 
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0] 
    }
  }
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { 
      duration: 0.2 
    }
  }
};

export const slideInUp: Variants = {
  hidden: { y: '100%' },
  visible: { 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    }
  },
  exit: { 
    y: '100%',
    transition: { 
      duration: 0.3 
    }
  }
};

export const slideInDown: Variants = {
  hidden: { y: '-100%' },
  visible: { 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    }
  },
  exit: { 
    y: '-100%',
    transition: { 
      duration: 0.3 
    }
  }
};

// Staggered animation for lists
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Card hover animation
export const cardHover = {
  rest: { scale: 1, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
  hover: { 
    scale: 1.02, 
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    transition: { duration: 0.2 }
  }
};

// Button hover animation
export const buttonHover = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } }
};

// Loading spinner animation
export const spinTransition = {
  loop: Infinity,
  ease: "linear",
  duration: 1
};

// Page transition variants
export const pageTransition: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.3,
      when: "afterChildren",
      staggerChildren: 0.05
    }
  }
};

// Helper function to create staggered delay for list items
export const getStaggeredDelay = (index: number, baseDelay: number = 0.1) => {
  return baseDelay * index;
};
