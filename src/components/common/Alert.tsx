import { ReactNode } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string | ReactNode;
  children?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({
  variant = 'info',
  title,
  message,
  children,
  dismissible = true,
  onDismiss,
}: AlertProps) {
  const variantStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      icon: 'text-red-600',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      icon: 'text-amber-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      icon: 'text-blue-600',
    },
  };

  const styles = variantStyles[variant];

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-4`}>
      <div className="flex gap-3">
        <div className={styles.icon}>{icons[variant]}</div>
        <div className="flex-1 min-w-0">
          {title && <h3 className={`font-semibold text-sm ${styles.text}`}>{title}</h3>}
          {message && (
            <p className={`${title ? 'mt-1' : ''} text-sm ${styles.text}`}>
              {typeof message === 'string' ? message : message}
            </p>
          )}
          {children}
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${styles.icon} hover:opacity-75 transition-opacity`}
            aria-label="Dismiss alert"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
