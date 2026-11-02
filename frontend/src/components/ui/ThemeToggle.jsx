import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle({ variant = 'segmented', className = '' }) {
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (variant === 'segmented') {
    return (
      <div
        role="group"
        aria-label="Theme mode selector"
        className={`inline-flex items-center p-0.5 rounded-full border border-bd bg-s2/60 transition-colors ${className}`}
      >
        <button
          type="button"
          onClick={() => setThemeMode('light')}
          aria-label="Light mode"
          aria-pressed={themeMode === 'light'}
          title="Light theme"
          className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ac cursor-pointer ${
            themeMode === 'light'
              ? 'bg-s text-t shadow-sm font-semibold border border-bd/80'
              : 'text-t2 hover:text-t hover:bg-s/40'
          }`}
        >
          <Sun className="w-4 h-4 text-amber-500" />
        </button>

        <button
          type="button"
          onClick={() => setThemeMode('dark')}
          aria-label="Dark mode"
          aria-pressed={themeMode === 'dark'}
          title="Dark theme"
          className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ac cursor-pointer ${
            themeMode === 'dark'
              ? 'bg-s text-t shadow-sm font-semibold border border-bd/80'
              : 'text-t2 hover:text-t hover:bg-s/40'
          }`}
        >
          <Moon className="w-4 h-4 text-blue-400" />
        </button>

        <button
          type="button"
          onClick={() => setThemeMode('system')}
          aria-label="System preference"
          aria-pressed={themeMode === 'system'}
          title="System preference"
          className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ac cursor-pointer ${
            themeMode === 'system'
              ? 'bg-s text-t shadow-sm font-semibold border border-bd/80'
              : 'text-t2 hover:text-t hover:bg-s/40'
          }`}
        >
          <Monitor className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Compact Single Button with Dropdown Menu
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Theme settings: currently ${themeMode} (${theme})`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={`Theme: ${themeMode} (${theme})`}
        className="min-h-[40px] min-w-[40px] p-2 flex items-center justify-center rounded-full border border-bd bg-s text-t hover:border-ac focus:outline-none focus:ring-2 focus:ring-ac transition-colors cursor-pointer shadow-sm"
      >
        {theme === 'dark' ? (
          <Moon className="w-4 h-4 text-blue-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-36 py-1 bg-s border border-bd rounded-xl shadow-lg z-50 text-xs font-medium backdrop-blur-md"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setThemeMode('light');
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors cursor-pointer ${
              themeMode === 'light' ? 'text-ac font-semibold bg-s2/60' : 'text-t hover:bg-s2/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
            </span>
            {themeMode === 'light' && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setThemeMode('dark');
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors cursor-pointer ${
              themeMode === 'dark' ? 'text-ac font-semibold bg-s2/60' : 'text-t hover:bg-s2/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-blue-400" /> Dark
            </span>
            {themeMode === 'dark' && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setThemeMode('system');
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors cursor-pointer ${
              themeMode === 'system' ? 'text-ac font-semibold bg-s2/60' : 'text-t hover:bg-s2/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5" /> System
            </span>
            {themeMode === 'system' && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
