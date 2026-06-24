import React, { useRef } from 'react';
import { motion, HTMLMotionProps, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hoverEffect = false, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLDivElement>) || internalRef;
    
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"]);
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);
    const glareOpacity = useTransform(mouseXSpring, [-0.5, 0, 0.5], [0.15, 0, 0.15]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hoverEffect) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      
      const width = rect.width;
      const height = rect.height;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const xPct = mouseX / width - 0.5;
      const yPct = mouseY / height - 0.5;
      
      x.set(xPct);
      y.set(yPct);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'glass-panel rounded-2xl p-6 relative overflow-hidden dark:bg-gray-900/40',
          hoverEffect && "perspective-1000",
          className
        )}
        style={{
          rotateX: hoverEffect ? rotateX : 0,
          rotateY: hoverEffect ? rotateY : 0,
        }}
        whileHover={hoverEffect ? { y: -2, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)' } : undefined}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {hoverEffect && (
          <motion.div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 60%)",
              opacity: glareOpacity,
              left: glareX,
              top: glareY,
              transform: "translate(-50%, -50%)",
              width: "200%",
              height: "200%"
            }}
          />
        )}
        <div style={{ height: '100%' }}>
          {children}
        </div>
      </motion.div>
    );
  }
);
GlassCard.displayName = 'GlassCard';
