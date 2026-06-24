import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GradientButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ children, className, variant = 'primary', size = 'md', ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-gradient-primary text-gray-900 hover:shadow-lg shadow-sm border border-white/40',
      secondary: 'bg-gradient-accent text-gray-900 hover:shadow-lg shadow-sm border border-white/40',
      glass: 'glass-button text-gray-800'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
GradientButton.displayName = 'GradientButton';
