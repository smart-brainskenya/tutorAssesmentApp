import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-sbk-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-sbk-slate-300 bg-white px-3 py-2 text-sm placeholder:text-sbk-slate-400 focus:outline-none focus:ring-2 focus:ring-sbk-blue focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-sbk-red-500 focus:ring-sbk-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-sbk-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
