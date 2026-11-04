import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-s border border-[#2A2A2A] rounded-[18px] p-5 sm:p-6 shadow-2xl text-t animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-[#2A2A2A] shrink-0">
          <h3 className="font-sans font-bold text-[18px] sm:text-[20px] text-t truncate pr-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-t2 hover:text-t hover:bg-s2 border border-transparent hover:border-bd active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4 overflow-y-auto flex-1 overscroll-contain pr-1">{children}</div>
      </div>
    </div>
  );
}
