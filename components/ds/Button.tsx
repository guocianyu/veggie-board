'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      tone: {
        neutral: 'bg-black/5 text-ink hover:bg-black/10',
        green: 'bg-brandGreen text-ink hover:bg-brandGreen/90',
        orange: 'bg-brandOrange text-white hover:bg-brandOrange/90',
        ghost: 'text-ink hover:bg-black/5',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm rounded-xl',
        md: 'px-4 py-2 text-sm rounded-2xl',
        lg: 'px-6 py-3 text-base rounded-2xl',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, tone, size, fullWidth, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <div
          className={cn(buttonVariants({ tone, size, fullWidth, className }))}
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
        />
      );
    }
    
    return (
      <button
        className={cn(buttonVariants({ tone, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
