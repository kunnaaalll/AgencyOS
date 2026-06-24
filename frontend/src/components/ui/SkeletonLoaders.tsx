import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.2, repeatType: 'reverse' }}
      className={cn("animate-pulse rounded-md bg-white/50", className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-3xl bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <Skeleton className="h-[125px] w-full rounded-2xl" />
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="p-6 rounded-3xl bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="w-full rounded-3xl border border-white/40 overflow-hidden bg-white/30 backdrop-blur-2xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)]">
      <div className="flex items-center border-b border-white/40 bg-white/40 p-4 space-x-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
