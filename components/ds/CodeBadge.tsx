'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface CodeBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  className?: string;
}

export function CodeBadge({ code, className, ...props }: CodeBadgeProps) {
  const paddedCode = code.padStart(6, '0');

  return (
    <div
      className={cn(
        'w-[72px] text-center rounded-md bg-ink text-white font-mono text-xs px-2 py-1',
        'flex items-center justify-center',
        className
      )}
      {...props}
    >
      {paddedCode}
    </div>
  );
}
