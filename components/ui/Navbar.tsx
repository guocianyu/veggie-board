'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  brand?: string;
  logo?: React.ReactNode;
}

// Logo SVG 元件
const VeggieLogo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0"
  >
    <rect width="32" height="32" rx="8" fill="#D1F472" />
    <path
      d="M8 12C8 10.8954 8.89543 10 10 10H22C23.1046 10 24 10.8954 24 12V20C24 21.1046 23.1046 22 22 22H10C8.89543 22 8 21.1046 8 20V12Z"
      fill="#0A0A0A"
    />
    <circle cx="12" cy="16" r="2" fill="#D1F472" />
    <circle cx="20" cy="16" r="2" fill="#D1F472" />
    <path
      d="M16 8V12M16 20V24M8 16H12M20 16H24"
      stroke="#0A0A0A"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      brand = '菜價看板 | VeggieBoard',
      logo,
      ...props
    },
    ref
  ) => {

    return (
      <nav
        className={cn(
          'bg-bg border-b border-gray-200',
          className
        )}
        ref={ref}
        aria-label="主導覽"
        {...props}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* 左側：Logo 和品牌 */}
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center space-x-3 text-xl font-bold text-ink hover:text-brandOrange transition-colors"
              >
                {logo || <VeggieLogo />}
                <span className="hidden sm:block">{brand}</span>
                <span className="sm:hidden">菜價看板</span>
              </Link>
            </div>

          </div>
        </div>
      </nav>
    );
  }
);

Navbar.displayName = 'Navbar';

export default Navbar;