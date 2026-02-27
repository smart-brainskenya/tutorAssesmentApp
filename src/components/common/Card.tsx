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
    default: 'bg-white border border-sbk-slate-200 shadow-sm',
    elevated: 'bg-white border border-sbk-slate-200 shadow-md',
    flat: 'bg-sbk-slate-50 border border-sbk-slate-100',
  };

  const hoverStyles = hover ? 'hover:border-sbk-slate-300 hover:shadow-md transition-all' : '';
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
