import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  subtext?: string | ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger';
}

export function MetricCard({
  label,
  value,
  icon,
  subtext,
  variant = 'neutral',
}: MetricCardProps) {
  const variantStyles = {
    neutral: 'bg-white border border-slate-200 shadow-sm',
    success: 'bg-green-50 border border-green-200',
    warning: 'bg-amber-50 border border-amber-200',
    danger: 'bg-red-50 border border-red-200',
  };

  return (
    <div className={`p-6 rounded-lg ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtext && (
            <p className="text-sm text-slate-500 mt-2">
              {typeof subtext === 'string' ? subtext : subtext}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-4 mt-1 text-slate-400 opacity-50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
