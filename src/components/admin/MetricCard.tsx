import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  subtext?: string;
  variant?: 'default' | 'danger' | 'success' | 'neutral';
}

export function MetricCard({ label, value, icon, subtext, variant = 'default' }: MetricCardProps) {
  const variants = {
    default: 'text-slate-900',
    danger: 'text-red-600',
    success: 'text-green-600',
    neutral: 'text-slate-500',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${variants[variant]}`}>{value}</p>
          {subtext && <p className="text-sm text-slate-500 mt-2">{subtext}</p>}
        </div>
        {icon && (
          <div className="ml-4 mt-1 opacity-40 text-slate-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
