'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  start?: React.ReactNode;
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  end?: React.ReactNode;
  clickable?: boolean;
  className?: string;
}

export function ListRow({
  start,
  primary,
  secondary,
  end,
  clickable = false,
  className,
  ...props
}: ListRowProps) {
  const baseClasses = 'flex items-center justify-between py-4 px-6 border-b border-black/10 last:border-b-0 transition-colors duration-200';
  const clickableClasses = clickable ? 'hover:bg-black/3 focus:outline-none rounded-xl text-left w-full' : '';

  if (clickable) {
    return (
      <button
        className={cn(baseClasses, clickableClasses, className)}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {/* 左側內容 */}
        {start && (
          <div className="flex-shrink-0">
            {start}
          </div>
        )}

        {/* 中間主要內容 */}
        <div className="flex-1 mx-4 min-w-0">
          {primary && (
            <div className="font-medium text-ink truncate">
              {primary}
            </div>
          )}
          {secondary && (
            <div className="text-sm text-muted truncate">
              {secondary}
            </div>
          )}
        </div>

        {/* 右側內容 */}
        {end && (
          <div className="flex-shrink-0 text-right tabular-nums">
            {end}
          </div>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(baseClasses, className)}
      {...props}
    >
      {/* 左側內容 */}
      {start && (
        <div className="flex-shrink-0">
          {start}
        </div>
      )}

      {/* 中間主要內容 */}
      <div className="flex-1 mx-4 min-w-0">
        {primary && (
          <div className="font-medium text-ink truncate">
            {primary}
          </div>
        )}
        {secondary && (
          <div className="text-sm text-muted truncate">
            {secondary}
          </div>
        )}
      </div>

      {/* 右側內容 */}
      {end && (
        <div className="flex-shrink-0 text-right tabular-nums">
          {end}
        </div>
      )}
    </div>
  );
}
