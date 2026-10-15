import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotificationBell from '../src/components/ui/NotificationBell';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';

describe('Phase 12: NotificationBell & Real-Time Feed UI', () => {
  it('renders notification bell icon button', () => {
    render(
      <AuthProvider>
        <NotificationProvider>
          <MemoryRouter>
            <NotificationBell />
          </MemoryRouter>
        </NotificationProvider>
      </AuthProvider>
    );

    const bellBtn = screen.getByTitle(/Notifications & Live Activity/i);
    expect(bellBtn).toBeInTheDocument();
  });

  it('opens activity feed dropdown when clicked', async () => {
    render(
      <AuthProvider>
        <NotificationProvider>
          <MemoryRouter>
            <NotificationBell />
          </MemoryRouter>
        </NotificationProvider>
      </AuthProvider>
    );

    const bellBtn = screen.getByTitle(/Notifications & Live Activity/i);
    fireEvent.click(bellBtn);

    expect(screen.getByText(/Activity Feed/i)).toBeInTheDocument();
    expect(screen.getByText(/Server-Sent Events Stream/i)).toBeInTheDocument();
  });
});
