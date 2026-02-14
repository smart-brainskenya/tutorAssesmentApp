import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'live' | 'draft' | 'danger' | 'success' | 'warning';
  children: ReactNode;
  icon?: ReactNode;
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'draft', children, icon, size = 'md' }: BadgeProps) {
  const variantStyles = {
    live: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    },
    draft: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
    },
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    success: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-3 py-1 text-sm font-semibold',
  };

  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeStyles[size]} font-medium`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}
