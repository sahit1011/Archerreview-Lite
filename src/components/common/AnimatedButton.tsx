'use client';

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';

// Press feedback only. The hover scale (1.02) + lift (-2) was a bouncy gimmick;
// hover state now comes from the CSS variant (brightness/bg color change).
const buttonHover: Variants = {
  rest: {},
  hover: {},
  tap: {
    scale: 0.98,
    transition: { duration: 0.1, ease: 'easeOut' },
  },
};

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  className?: string;
}

export default function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  ...props
}: AnimatedButtonProps) {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-colors';
  
  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-primary text-primary-foreground font-semibold hover:brightness-110 focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-muted focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-border',
    outline: 'bg-transparent text-primary border border-primary hover:bg-primary/10 focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-primary',
    danger: 'bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-destructive',
    success: 'bg-success/15 text-success border border-success/30 hover:bg-success/25 focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-success',
  };
  
  // Width style
  const widthStyle = fullWidth ? 'w-full' : '';
  
  // Disabled style
  const disabledStyle = props.disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  // Combined styles
  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${disabledStyle} ${className}`;
  
  return (
    <motion.button
      className={combinedStyles}
      whileHover="hover"
      whileTap="tap"
      initial="rest"
      variants={buttonHover}
      disabled={loading || props.disabled}
      {...(props as any)}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </>
      )}
    </motion.button>
  );
}
