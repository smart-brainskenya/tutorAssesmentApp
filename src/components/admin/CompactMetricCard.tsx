import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CompactMetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string | number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
  className?: string;
}

export function CompactMetricCard({ label, value, trend, icon, className }: CompactMetricCardProps) {
  return (
    <div className={cn("bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-between h-full", className)}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-500 truncate pr-2">{label}</h3>
        {icon && <div className="text-slate-400 opacity-60">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>

      {trend && (
        <div className="mt-2 flex items-center text-xs">
          <span className={cn(
            "flex items-center font-medium gap-0.5",
            trend.direction === 'up' ? "text-green-600" :
            trend.direction === 'down' ? "text-red-600" :
            "text-slate-500"
          )}>
            {trend.direction === 'up' && <ArrowUpRight className="w-3 h-3" />}
            {trend.direction === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
            {trend.value}
          </span>
          <span className="text-slate-400 ml-1.5">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
