import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export function Alert({ children, title, variant = 'info', className = '' }) {
  const configs = {
    info: {
      container: 'bg-s border-bd text-t2',
      icon: <Info className="h-5 w-5 text-series shrink-0" aria-hidden="true" />,
    },
    success: {
      container: 'bg-ok/10 border-ok/30 text-ok',
      icon: <CheckCircle className="h-5 w-5 text-ok shrink-0" aria-hidden="true" />,
    },
    warning: {
      container: 'bg-alert-bg border-alert-border text-wa',
      icon: <AlertTriangle className="h-5 w-5 text-wa shrink-0" aria-hidden="true" />,
    },
    danger: {
      container: 'bg-no/10 border-no/30 text-no',
      icon: <AlertCircle className="h-5 w-5 text-no shrink-0" aria-hidden="true" />,
    },
  };

  const current = configs[variant] || configs.info;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-card border text-sm ${current.container} ${className}`}
    >
      {current.icon}
      <div className="flex-1">
        {title && <h4 className="font-semibold text-t mb-1">{title}</h4>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default Alert;
