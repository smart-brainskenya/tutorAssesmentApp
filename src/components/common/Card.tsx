import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  clickable?: boolean;
  hover?: boolean;
  variant?: 'default' | 'elevated' | 'flat';
}

export function Card({
  children,
  className,
  clickable = false,
  hover = true,
  variant = 'default',
}: CardProps) {
  const variantStyles = {
    default: 'bg-sbk-bg-main border border-sbk-slate-200 shadow-sm',
    elevated: 'bg-sbk-bg-main border border-sbk-slate-200 shadow-md',
    flat: 'bg-sbk-bg-alt border border-sbk-slate-200',
  };

  const hoverStyles = hover ? 'hover:border-sbk-blue-light hover:ring-2 hover:ring-sbk-blue-light hover:ring-offset-1 transition-all duration-300' : '';
  const clickableStyles = clickable ? 'cursor-pointer' : '';

  return (
    <div
      className={cn(
        'rounded-lg',
        variantStyles[variant],
        hoverStyles,
        clickableStyles,
        className
      )}
    >
      {children}
    </div>
  );
}
