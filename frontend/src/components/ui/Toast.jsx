import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export function Toast({ message, type = 'error', onClose }) {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-card shadow-2xl text-[14px] border ${
        isError
          ? 'bg-[#291313] text-no border-no/40'
          : 'bg-[#102416] text-ok border-ok/40'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 text-no shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle className="w-5 h-5 text-ok shrink-0" aria-hidden="true" />
      )}
      <span className="font-medium text-white">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-t2 hover:text-white transition-colors focus:outline-none"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Toast;
