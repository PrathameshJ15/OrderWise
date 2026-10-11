import React from 'react';

export function Badge({ children, variant = 'default', className = '' }) {
  const variantMap = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    primary: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    scarce: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variantMap[variant] || variantMap.default} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
