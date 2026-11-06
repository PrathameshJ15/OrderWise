import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const q = new URLSearchParams(window.location.search).get('theme');
        if (q === 'light' || q === 'dark') {
          return q;
        }
      }
      const saved = localStorage.getItem('orderwise_theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // ignore
    }
    // Default to dark mode for first-time users as required
    return 'dark';
  });

  // Apply data-theme attribute on root HTML element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const setTheme = (mode) => {
    const nextTheme = mode === 'light' ? 'light' : 'dark';
    setThemeState(nextTheme);
    try {
      localStorage.setItem('orderwise_theme', nextTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode: theme, // backward-compatibility alias
        setTheme,
        setThemeMode: setTheme, // backward-compatibility alias
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark',
      themeMode: 'dark',
      setTheme: () => {},
      setThemeMode: () => {},
      toggleTheme: () => {},
      isDark: true,
    };
  }
  return context;
}
