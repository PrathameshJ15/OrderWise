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
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center bg-s rounded-card border border-dashed border-bd ${className}`}>
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-s2 text-t2 mb-4 border border-bd" aria-hidden="true">
        <Icon className="w-6 h-6 text-t2" />
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-[14px] text-t2 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
