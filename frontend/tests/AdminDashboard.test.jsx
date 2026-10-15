import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../src/pages/admin/AdminDashboard';
import InventoryManagement from '../src/pages/admin/InventoryManagement';
import OrderManagement from '../src/pages/admin/OrderManagement';
import AllocationCenter from '../src/pages/admin/AllocationCenter';
import apiClient from '../src/api/client';

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin Operations', role: 'admin', email: 'admin@orderwise.com' },
    token: 'mock-jwt-token',
    logout: vi.fn(),
  }),
}));

vi.mock('../src/contexts/AuthContext', () => {
  const React = require('react');
  return {
    AuthContext: React.createContext({
      user: { id: 1, name: 'Admin Operations', role: 'admin', email: 'admin@orderwise.com' },
      token: 'mock-jwt-token',
      logout: vi.fn(),
    }),
    useAuth: () => ({
      user: { id: 1, name: 'Admin Operations', role: 'admin', email: 'admin@orderwise.com' },
      token: 'mock-jwt-token',
      logout: vi.fn(),
    }),
    AuthProvider: ({ children }) => <div>{children}</div>,
  };
});

vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock Recharts ResponsiveContainer to avoid jsdom zero width/height layout issues
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  };
});

describe('Frontend Phase 7: Admin Operations & Dashboard UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Admin Dashboard with real KPIs, module links and chart containers', async () => {
    const mockProducts = [
      { id: 1, sku: 'PUMP-X100', name: 'Industrial Pump Model X' },
      { id: 2, sku: 'VALVE-B200', name: 'Safety Valve Type B' },
    ];
    const mockOrders = [
      { id: 1, status: 'confirmed', total_requested_quantity: 100 },
      { id: 2, status: 'pending', total_requested_quantity: 50 },
    ];
    const mockInventory = [
      { product_id: 1, sku: 'PUMP-X100', product_name: 'Industrial Pump Model X', on_hand_quantity: 150, reserved_quantity: 0 },
      { product_id: 2, sku: 'VALVE-B200', product_name: 'Safety Valve Type B', on_hand_quantity: 80, reserved_quantity: 0 },
    ];
    const mockAlerts = { alerts: [], stats: { total: 0, unresolved: 0 } };
    const mockRuns = [];

    apiClient.get.mockImplementation((url) => {
      if (url === '/products') return Promise.resolve({ data: mockProducts });
      if (url === '/orders') return Promise.resolve({ data: mockOrders });
      if (url === '/inventory') return Promise.resolve({ data: mockInventory });
      if (url.startsWith('/alerts')) return Promise.resolve({ data: mockAlerts });
      if (url === '/allocation/runs') return Promise.resolve({ data: mockRuns });
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Admin Operations Command/i)).toBeInTheDocument();

    await waitFor(() => {
      // Metric cards
      expect(screen.getByText('Active Catalog')).toBeInTheDocument();
      expect(screen.getByText('Customer Orders')).toBeInTheDocument();
      expect(screen.getByText('Total On-Hand')).toBeInTheDocument();
      expect(screen.getByText('Allocation Center')).toBeInTheDocument();
      expect(screen.getByText('Product Management')).toBeInTheDocument();
      expect(screen.getByText('Inventory Hub')).toBeInTheDocument();
    });
  });

  it('renders Inventory Management and performs stock adjustment with mandatory reason', async () => {
    const mockInventory = [
      {
        product_id: 3,
        product_name: 'Pressure Gauge Pro',
        sku: 'GAUGE-P300',
        on_hand_quantity: 40,
        reserved_quantity: 10,
        available_quantity: 30,
        safety_stock: 15,
        reorder_point: 70,
        version: 1,
      },
    ];

    apiClient.get.mockImplementation((url) => {
      if (url === '/inventory') return Promise.resolve({ data: mockInventory });
      if (url.includes('/movements')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    apiClient.put.mockResolvedValue({
      data: { success: true },
    });

    render(
      <MemoryRouter>
        <InventoryManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pressure Gauge Pro')).toBeInTheDocument();
      expect(screen.getByText('GAUGE-P300')).toBeInTheDocument();
    });

    // Click Adjust Stock button
    const adjustBtn = screen.getByRole('button', { name: /Adjust Stock/i });
    fireEvent.click(adjustBtn);

    expect(screen.getByText(/Adjust Physical Inventory/i)).toBeInTheDocument();

    // Fill in adjustment
    const qtyInput = screen.getByLabelText(/New On-Hand Quantity/i);
    const reasonInput = screen.getByLabelText(/Mandatory Audit Reason/i);

    fireEvent.change(qtyInput, { target: { value: '45' } });
    fireEvent.change(reasonInput, { target: { value: 'Cycle count physical stock reconciliation' } });

    const saveBtn = screen.getByRole('button', { name: /Confirm Adjustment/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(
        '/inventory/3',
        expect.objectContaining({
          on_hand_quantity: 45,
          reason: 'Cycle count physical stock reconciliation',
          expected_version: 1,
        })
      );
    });
  });

  it('renders Order Management and confirms a pending order', async () => {
    const mockOrders = [
      {
        id: 701,
        customer_name: 'Alice Customer',
        customer_email: 'alice@demo.com',
        status: 'pending',
        priority_level: 'HIGH',
        total_requested_quantity: 25,
        item_count: 1,
        promised_delivery_date: '2026-10-25',
        created_at: new Date().toISOString(),
      },
    ];

    apiClient.get.mockImplementation((url) => {
      if (url.startsWith('/orders')) return Promise.resolve({ data: mockOrders });
      return Promise.resolve({ data: [] });
    });

    apiClient.patch.mockResolvedValue({
      data: { id: 701, status: 'confirmed' },
    });

    render(
      <MemoryRouter>
        <OrderManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('#701')).toBeInTheDocument();
      expect(screen.getByText('Alice Customer')).toBeInTheDocument();
      expect(screen.getByText(/HIGH/i)).toBeInTheDocument();
    });

    // Click Confirm button
    const confirmBtn = screen.getByRole('button', { name: /Confirm/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/orders/701/confirm');
    });
  });

  it('renders Allocation Center and executes an allocation run', async () => {
    const mockRuns = [
      {
        id: 1,
        run_number: 1,
        status: 'completed',
        is_dry_run: false,
        total_items_processed: 3,
        fulfilled_count: 1,
        partially_fulfilled_count: 0,
        deferred_count: 2,
        created_at: new Date().toISOString(),
        execution_time_ms: 24,
      },
    ];

    const mockProducts = [
      { id: 3, sku: 'GAUGE-P300', name: 'Pressure Gauge Pro' },
    ];

    const mockRunDetails = {
      run: mockRuns[0],
      results: [
        {
          order_item_id: 11,
          order_id: 101,
          customer_name: 'Charlie Customer',
          product_name: 'Pressure Gauge Pro',
          product_sku: 'GAUGE-P300',
          requested_quantity: 30,
          allocated_quantity: 30,
          status: 'fulfilled',
          explanation: {
            reason: 'Available stock was sufficient to fulfill the complete request.',
          },
        },
      ],
    };

    apiClient.get.mockImplementation((url) => {
      if (url === '/allocation/runs') return Promise.resolve({ data: mockRuns });
      if (url === '/products') return Promise.resolve({ data: mockProducts });
      if (url === '/allocation/runs/1') return Promise.resolve({ data: mockRunDetails });
      return Promise.resolve({ data: [] });
    });

    apiClient.post.mockResolvedValue({
      data: {
        run: { id: 2, run_number: 2, status: 'completed', is_dry_run: false },
        results: mockRunDetails.results,
        impact: { total_changes: 0, improvements: 0, degradations: 0, changes: [] },
      },
    });

    render(
      <MemoryRouter>
        <AllocationCenter />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Allocation Center/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Run Engine/i })).toBeInTheDocument();
    });

    // Click Run Engine to open modal
    const runBtn = screen.getByRole('button', { name: /Run Engine/i });
    fireEvent.click(runBtn);

    expect(screen.getByText(/Execute Order Allocation/i)).toBeInTheDocument();

    // Execute run inside modal
    const executeBtn = screen.getByRole('button', { name: /Execute Allocation/i });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/allocation/run',
        expect.objectContaining({
          dry_run: false,
        })
      );
    });
  });
});
