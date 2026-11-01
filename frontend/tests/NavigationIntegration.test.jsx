import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../src/components/layout/ProtectedRoute';
import AccessDenied from '../src/components/ui/AccessDenied';
import NotFound from '../src/pages/NotFound';
import Breadcrumbs from '../src/components/layout/Breadcrumbs';
import Sidebar, { ADMIN_NAV_ITEMS } from '../src/components/layout/Sidebar';
import SimulationLab from '../src/pages/admin/SimulationLab';
import apiClient from '../src/api/client';

let mockUser = null;

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    logout: vi.fn(),
  }),
}));

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('../src/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    connected: true,
  }),
  NotificationProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Phase 9: Full-Stack Page & Route Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
  });

  it('redirects unauthenticated visitor to /login from protected routes', () => {
    mockUser = null;

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <div>Customer Dashboard Secret</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Form</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Customer Dashboard Secret')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Form')).toBeInTheDocument();
  });

  it('renders AccessDenied (403) when customer attempts to access admin route', () => {
    mockUser = { id: 2, name: 'Alice Customer', role: 'customer', email: 'alice@demo.com' };

    render(
      <MemoryRouter initialEntries={['/admin/allocation']}>
        <Routes>
          <Route
            path="/admin/allocation"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Allocation Engine Sensitive Area</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Allocation Engine Sensitive Area')).not.toBeInTheDocument();
    expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/403 Forbidden/i)).toBeInTheDocument();
    expect(screen.getByText('CUSTOMER')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('renders AccessDenied (403) when admin attempts to access customer-only route', () => {
    mockUser = { id: 1, name: 'Super Admin', role: 'admin', email: 'admin@orderwise.com' };

    render(
      <MemoryRouter initialEntries={['/orders/new']}>
        <Routes>
          <Route
            path="/orders/new"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <div>Create Order Form</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Create Order Form')).not.toBeInTheDocument();
    expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('CUSTOMER')).toBeInTheDocument();
  });

  it('renders 404 NotFound page on invalid routes and provides dashboard return link', () => {
    mockUser = { id: 1, name: 'Super Admin', role: 'admin', email: 'admin@orderwise.com' };

    render(
      <MemoryRouter initialEntries={['/nonexistent-route-99']}>
        <Routes>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/404 Route Not Located/i)).toBeInTheDocument();
    expect(screen.getByText(/Route Not Found/i)).toBeInTheDocument();
    expect(screen.getByText('/nonexistent-route-99')).toBeInTheDocument();
    expect(screen.getByText(/Go to Command Hub/i)).toBeInTheDocument();
  });

  it('renders Breadcrumbs component with hierarchy according to current URL path', () => {
    render(
      <MemoryRouter initialEntries={['/admin/inventory']}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText('Command Center')).toBeInTheDocument();
    expect(screen.getByText('Inventory Hub')).toBeInTheDocument();
  });

  it('filters Admin Sidebar navigation items based on role (Admin vs Inventory Manager)', () => {
    // 1. Admin gets all 12 modules
    mockUser = { id: 1, role: 'admin' };
    const { unmount } = render(
      <MemoryRouter>
        <Sidebar mobileOpen={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Allocation Center')).toBeInTheDocument();
    expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Simulation Lab')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Audit Viewer')).toBeInTheDocument();
    unmount();

    // 2. Inventory Manager sees only authorized modules
    mockUser = { id: 3, role: 'inventory_manager' };
    render(
      <MemoryRouter>
        <Sidebar mobileOpen={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Product Management')).toBeInTheDocument();
    expect(screen.getByText('Inventory Management')).toBeInTheDocument();
    expect(screen.getByText('Order Management')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Replenishment')).toBeInTheDocument();

    // Restricted modules must NOT be present
    expect(screen.queryByText('Allocation Center')).not.toBeInTheDocument();
    expect(screen.queryByText('AI Recommendations')).not.toBeInTheDocument();
    expect(screen.queryByText('Simulation Lab')).not.toBeInTheDocument();
    expect(screen.queryByText('Audit Viewer')).not.toBeInTheDocument();
  });

  it('renders SimulationLab and executes in-memory simulation without modifying live database', async () => {
    mockUser = { id: 1, role: 'admin' };

    apiClient.get.mockImplementation((url) => {
      if (url.startsWith('/products')) {
        return Promise.resolve({ data: [{ id: 1, sku: 'GAUGE-P300', name: 'Pressure Gauge Pro' }] });
      }
      if (url.startsWith('/orders')) {
        return Promise.resolve({ data: [{ id: 10, customer_id: 2, status: 'pending' }] });
      }
      if (url.startsWith('/simulations')) {
        return Promise.resolve({ data: { simulations: [] } });
      }
      return Promise.resolve({ data: [] });
    });

    apiClient.post.mockResolvedValue({
      data: {
        simulation_id: 101,
        scenario_type: 'inventory_increase',
        diff: {
          summary: {
            total_items_compared: 3,
            total_changed: 1,
            improvements: 1,
            degradations: 0,
          },
          item_diffs: [
            {
              order_id: 10,
              product_name: 'Pressure Gauge Pro',
              requested_quantity: 25,
              previous_allocated: 0,
              current_allocated: 25,
              delta: 25,
              current_status: 'fulfilled',
            },
          ],
        },
      },
    });

    render(
      <MemoryRouter>
        <SimulationLab />
      </MemoryRouter>
    );

    expect(screen.getByText(/WHAT-IF SCENARIO EXPERIMENTATION LAB/i)).toBeInTheDocument();
    expect(screen.getByText(/In-Memory Sandboxed Execution Guarantee/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/GAUGE-P300/i)).toBeInTheDocument();
    });

    const runBtn = screen.getByRole('button', { name: /Run Simulation/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/simulations',
        expect.objectContaining({
          scenario_type: 'inventory_increase',
          save_record: true,
        })
      );
      expect(screen.getByText('Status: Completed Successfully')).toBeInTheDocument();
      expect(screen.getByText('+25')).toBeInTheDocument();
    });
  });
});
