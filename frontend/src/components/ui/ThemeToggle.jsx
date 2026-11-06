import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

/**
 * ThemeToggle
 * Compact manual theme switcher with two options:
 * - ☀️ Light
 * - 🌙 Dark
 * No automatic or system default options.
 */
export default function ThemeToggle({ variant = 'segmented', className = '' }) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'segmented') {
    return (
      <div
        role="group"
        aria-label="Theme mode selector"
        className={`inline-flex items-center p-0.5 rounded-full border border-bd bg-s2/80 transition-colors shadow-xs ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-label="Light mode"
          aria-pressed={!isDark}
          title="Switch to light mode"
          className={`h-7 px-2.5 flex items-center space-x-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
            !isDark
              ? 'bg-s text-t shadow-xs font-semibold border border-bd'
              : 'text-t2 hover:text-t hover:bg-s/30'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] font-sans">Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-label="Dark mode"
          aria-pressed={isDark}
          title="Switch to dark mode"
          className={`h-7 px-2.5 flex items-center space-x-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
            isDark
              ? 'bg-s text-t shadow-xs font-semibold border border-bd'
              : 'text-t2 hover:text-t hover:bg-s/30'
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-[11px] font-sans">Dark</span>
        </button>
      </div>
    );
  }

  // Single button toggle for compact mobile viewports
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`min-h-[36px] min-w-[36px] p-2 flex items-center justify-center rounded-full border border-bd bg-s text-t hover:border-ac focus:outline-none focus:ring-2 focus:ring-ac transition-colors cursor-pointer shadow-xs ${className}`}
    >
      {isDark ? (
        <Moon className="w-4 h-4 text-blue-400" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500" />
      )}
    </button>
  );
}
