import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Reports from '../src/pages/admin/Reports';
import AuditViewer from '../src/pages/admin/AuditViewer';
import { AuthProvider } from '../src/contexts/AuthContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { MemoryRouter } from 'react-router-dom';

describe('Phase 13: Reports & Audit Viewer UI Tests', () => {
  it('renders Reports page with on-screen KPIs and CSV export options', async () => {
    render(
      <AuthProvider>
        <NotificationProvider>
          <MemoryRouter>
            <Reports />
          </MemoryRouter>
        </NotificationProvider>
      </AuthProvider>
    );

    expect(screen.getByText(/Supply Chain & Allocation Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Order Fill Rate/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Deferred Demand/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Orders CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/Allocation Runs CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/Inventory Movements CSV/i)).toBeInTheDocument();
  });

  it('renders Audit Log Viewer with filters and table headers', async () => {
    render(
      <AuthProvider>
        <NotificationProvider>
          <MemoryRouter>
            <AuditViewer />
          </MemoryRouter>
        </NotificationProvider>
      </AuthProvider>
    );

    expect(screen.getByText(/Audit Log Viewer/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Filter by actor name or email/i)).toBeInTheDocument();
    expect(screen.getByText(/All Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/System Audit Records/i)).toBeInTheDocument();
  });
});
