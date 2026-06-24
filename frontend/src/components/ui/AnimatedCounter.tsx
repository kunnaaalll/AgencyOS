import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatValue?: (val: number) => string;
  className?: string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1.5, 
  formatValue = (val) => Math.round(val).toString(),
  className 
}: AnimatedCounterProps) {
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    springValue.set(value);
    setHasAnimated(true);
  }, [value, springValue]);

  const displayValue = useTransform(springValue, (current) => {
    // If it's done animating or hasn't started, just show the actual formatted value
    if (hasAnimated && current === value) {
      return formatValue(value);
    }
    return formatValue(current);
  });

  return <motion.span className={className}>{displayValue}</motion.span>;
}
