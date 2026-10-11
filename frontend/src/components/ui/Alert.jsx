import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export function Alert({ children, title, variant = 'info', className = '' }) {
  const configs = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: <Info className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />,
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />,
    },
    danger: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" aria-hidden="true" />,
    },
  };

  const current = configs[variant] || configs.info;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${current.container} ${className}`}
    >
      {current.icon}
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default Alert;
