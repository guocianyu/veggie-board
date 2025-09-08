'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const cardVariants = cva(
  'rounded-3xl transition-all duration-200',
  {
    variants: {
      tone: {
        surface: 'bg-surface text-ink',
        green: 'bg-brandGreen text-ink',
        orange: 'bg-brandOrange text-white',
      },
      elevated: {
        true: 'shadow-card hover:shadow-card-hover',
        false: 'shadow-none',
      },
    },
    defaultVariants: {
      tone: 'surface',
      elevated: true,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tone, elevated, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'div' : 'div';
    
    return (
      <Comp
        className={cn(cardVariants({ tone, elevated, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter, cardVariants };
