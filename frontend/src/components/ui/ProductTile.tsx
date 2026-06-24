import React from 'react'
import { cn } from '@/lib/utils'

interface ProductTileProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark'
  children: React.ReactNode
}

export function ProductTile({ variant = 'light', className, children, ...props }: ProductTileProps) {
  const isDark = variant === 'dark'
  
  return (
    <div
      className={cn(
        "rounded-[18px] p-[32px] overflow-hidden relative transition-transform duration-500 hover:scale-[1.01]",
        isDark 
          ? "bg-[#272729] text-white" 
          : "bg-[#ffffff] text-[#1d1d1f] shadow-[0_5px_30px_rgba(0,0,0,0.08)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
