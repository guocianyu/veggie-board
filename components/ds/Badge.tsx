'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      tone: {
        neutral: 'bg-black/5 text-ink hover:bg-black/10 focus:ring-brandOrange',
        green: 'bg-brandGreen text-ink hover:bg-brandGreen/90 focus:ring-brandGreen',
        orange: 'bg-brandOrange text-white hover:bg-brandOrange/90 focus:ring-brandOrange',
      },
      size: {
        sm: 'px-2 py-1 text-xs rounded-lg',
        md: 'px-3 py-1.5 text-sm rounded-xl',
        lg: 'px-4 py-2 text-base rounded-xl',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'sm',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, tone, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'div' : 'div';
    
    return (
      <Comp
        className={cn(badgeVariants({ tone, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
