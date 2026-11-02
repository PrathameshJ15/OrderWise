import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import ThemeToggle from '../src/components/ui/ThemeToggle';

function TestConsumer() {
  const { theme, themeMode, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="current-mode">{themeMode}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
      <ThemeToggle variant="segmented" />
      <ThemeToggle variant="button" />
    </div>
  );
}

describe('Theme System & ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with default dark theme and sets data-theme attribute on documentElement', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles between dark and light themes and updates localStorage and documentElement', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    // Initial state
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');

    // Click toggle
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('orderwise_theme')).toBe('light');

    // Toggle back
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('orderwise_theme')).toBe('dark');
  });

  it('segmented ThemeToggle allows directly selecting light, dark, and system modes', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    const lightBtn = screen.getByRole('button', { name: /light mode/i });
    const darkBtn = screen.getByRole('button', { name: /dark mode/i });
    const systemBtn = screen.getByRole('button', { name: /system preference/i });

    expect(lightBtn).toBeDefined();
    expect(darkBtn).toBeDefined();
    expect(systemBtn).toBeDefined();

    // Select light
    fireEvent.click(lightBtn);
    expect(screen.getByTestId('current-mode').textContent).toBe('light');
    expect(localStorage.getItem('orderwise_theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Select dark
    fireEvent.click(darkBtn);
    expect(screen.getByTestId('current-mode').textContent).toBe('dark');
    expect(localStorage.getItem('orderwise_theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // Select system
    fireEvent.click(systemBtn);
    expect(screen.getByTestId('current-mode').textContent).toBe('system');
    expect(localStorage.getItem('orderwise_theme')).toBe('system');
  });
});
