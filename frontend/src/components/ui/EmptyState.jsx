import React from 'react';
import { PackageOpen } from 'lucide-react';

export function EmptyState({
  title = 'No items found',
  description = 'There are no records to display at this time.',
  icon: Icon = PackageOpen,
  actionText,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 ${className}`}>
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 text-slate-500 mb-4" aria-hidden="true">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
