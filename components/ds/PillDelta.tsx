'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface PillDeltaProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  showSign?: boolean;
  className?: string;
}

export function PillDelta({ 
  value, 
  showSign = true, 
  className, 
  ...props 
}: PillDeltaProps) {
  const isPositive = value >= 0;
  const sign = isPositive ? '↑' : '↓';
  const absValue = Math.abs(value);
  const formattedValue = `${absValue.toFixed(1)}%`;

  return (
    <div
      className={cn(
        'px-3 py-1 rounded-full text-xs font-semibold w-[80px] text-center flex items-center justify-center',
        isPositive
          ? 'bg-brandGreen text-ink'
          : 'bg-brandOrange text-white',
        className
      )}
      {...props}
    >
      {showSign ? `${sign} ${formattedValue}` : formattedValue}
    </div>
  );
}
