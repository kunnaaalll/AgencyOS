import React from 'react';

export function AppSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-8 pb-16 space-y-8 animate-pulse w-full h-full">
      {/* Header Skeleton */}
      <div className="flex justify-between items-start mb-12">
        <div className="space-y-4">
          <div className="h-10 w-64 bg-[var(--color-surface-soft)] rounded-lg"></div>
          <div className="h-5 w-48 bg-[var(--color-surface-soft)] opacity-50 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-[var(--color-surface-soft)] rounded-lg"></div>
      </div>
      
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-[var(--color-surface-soft)] rounded-xl border border-[var(--color-hairline)] opacity-70"></div>
        ))}
      </div>
      
      {/* Chart/Body Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-[var(--color-surface-soft)] rounded-xl border border-[var(--color-hairline)] opacity-60"></div>
        <div className="h-80 bg-[var(--color-surface-soft)] rounded-xl border border-[var(--color-hairline)] opacity-60"></div>
      </div>
    </div>
  );
}
