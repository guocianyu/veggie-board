'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedOption {
  label: string;
  value: string;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  direction?: 'row' | 'col';
}

export function Segmented({
  options,
  value,
  onChange,
  className,
  disabled = false,
  direction = 'row',
}: SegmentedProps) {
  return (
    <div
      className={cn(
        'flex rounded-3xl bg-gray-100 p-1',
        direction === 'col' ? 'flex-col' : 'flex-row',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      role="tablist"
      aria-label="選項切換"
    >
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-pressed={value === option.value}
          aria-selected={value === option.value}
          className={cn(
            'px-6 py-3 text-sm font-medium rounded-3xl transition-all duration-200',
            'focus:outline-none',
            'disabled:opacity-50 disabled:pointer-events-none',
            value === option.value
              ? 'bg-white text-ink shadow-sm'
              : 'text-muted hover:text-ink'
          )}
          onClick={() => !disabled && onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
