import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export function Toast({ message, type = 'error', onClose }) {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm border ${
        isError
          ? 'bg-rose-50 text-rose-900 border-rose-300'
          : 'bg-emerald-50 text-emerald-900 border-emerald-300'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
      )}
      <span className="font-medium">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-slate-600 focus:outline-none"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Toast;
