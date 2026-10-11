import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CustomerDashboard from '../src/pages/customer/CustomerDashboard';
import ProductCatalog from '../src/pages/customer/ProductCatalog';
import CreateOrder from '../src/pages/customer/CreateOrder';
import MyOrders from '../src/pages/customer/MyOrders';
import OrderDetail from '../src/pages/customer/OrderDetail';
import apiClient from '../src/api/client';

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 2, name: 'Alice Customer', role: 'customer', email: 'alice@demo.com' },
    token: 'mock-jwt-token',
    logout: vi.fn(),
  }),
}));

vi.mock('../src/contexts/AuthContext', () => {
  const React = require('react');
  return {
    AuthContext: React.createContext({
      user: { id: 2, name: 'Alice Customer', role: 'customer', email: 'alice@demo.com' },
      token: 'mock-jwt-token',
      logout: vi.fn(),
    }),
    useAuth: () => ({
      user: { id: 2, name: 'Alice Customer', role: 'customer', email: 'alice@demo.com' },
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

describe('Frontend Phase 6: Customer Portal UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Customer Dashboard with real order status metrics and recent orders', async () => {
    const mockOrders = [
      {
        id: 101,
        status: 'allocated',
        created_at: new Date().toISOString(),
        items: [{ id: 1, product_name: 'Pressure Gauge Pro', requested_quantity: 25 }],
      },
      {
        id: 102,
        status: 'pending',
        created_at: new Date().toISOString(),
        items: [{ id: 2, product_name: 'Safety Valve Type B', requested_quantity: 50 }],
      },
    ];

    apiClient.get.mockImplementation((url) => {
      if (url.startsWith('/orders')) {
        return Promise.resolve({ data: mockOrders });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <CustomerDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Customer Command Hub/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Customer')).toBeInTheDocument();
      expect(screen.getByText('#101')).toBeInTheDocument();
      expect(screen.getByText('#102')).toBeInTheDocument();
    });
  });

  it('renders Product Catalog with active hardware items and search filtering', async () => {
    const mockProducts = [
      {
        id: 1,
        sku: 'PUMP-X100',
        name: 'Industrial Pump Model X',
        description: 'High pressure pump',
        is_active: true,
        available_quantity: 150,
        on_hand_quantity: 150,
      },
      {
        id: 3,
        sku: 'GAUGE-P300',
        name: 'Pressure Gauge Pro',
        description: 'Critical monitoring gauge',
        is_active: true,
        available_quantity: 40,
        on_hand_quantity: 40,
      },
    ];

    apiClient.get.mockImplementation((url) => {
      if (url.startsWith('/products')) {
        return Promise.resolve({ data: mockProducts });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <ProductCatalog />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Industrial Pump Model X')).toBeInTheDocument();
      expect(screen.getByText('Pressure Gauge Pro')).toBeInTheDocument();
    });

    // Test search filter
    const searchInput = screen.getByPlaceholderText(/Search catalog by product name or SKU/i);
    fireEvent.change(searchInput, { target: { value: 'GAUGE' } });

    expect(screen.getByText('Pressure Gauge Pro')).toBeInTheDocument();
    expect(screen.queryByText('Industrial Pump Model X')).not.toBeInTheDocument();
  });

  it('validates Create Order form rules (minimum quantity <= requested quantity) and creates order', async () => {
    const mockProducts = [
      { id: 3, sku: 'GAUGE-P300', name: 'Pressure Gauge Pro', available_quantity: 40 },
    ];

    apiClient.get.mockImplementation((url) => {
      if (url.startsWith('/products')) {
        return Promise.resolve({ data: mockProducts });
      }
      return Promise.resolve({ data: [] });
    });

    apiClient.post.mockResolvedValue({
      data: { id: 200, status: 'pending' },
    });

    render(
      <MemoryRouter>
        <CreateOrder />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Create Order Requisition/i)).toBeInTheDocument();
    });

    // Inputs: requested qty, minimum acceptable qty
    const reqQtyInput = screen.getByLabelText(/Requested Quantity/i);
    const minQtyInput = screen.getByLabelText(/Min Acceptable/i);

    // Set invalid minimum > requested
    fireEvent.change(reqQtyInput, { target: { value: '10' } });
    fireEvent.change(minQtyInput, { target: { value: '15' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Order for Allocation/i });
    fireEvent.click(submitBtn);

    // Expect validation error
    await waitFor(() => {
      expect(
        screen.getByText(/Minimum acceptable quantity cannot exceed requested quantity/i)
      ).toBeInTheDocument();
    });

    // Fix the validation
    fireEvent.change(minQtyInput, { target: { value: '5' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/orders',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              requested_quantity: 10,
              minimum_acceptable_quantity: 5,
            }),
          ]),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String),
          }),
        })
      );
    });
  });

  it('renders My Orders list with status badges and details navigation', async () => {
    const mockOrders = [
      {
        id: 301,
        status: 'fulfilled',
        total_requested_quantity: 25,
        total_allocated_quantity: 25,
        item_count: 1,
        promised_delivery_date: '2026-10-25',
        created_at: new Date().toISOString(),
      },
    ];

    apiClient.get.mockImplementation((url) => {
      if (url.startsWith('/orders')) {
        return Promise.resolve({ data: mockOrders });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <MyOrders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('#301')).toBeInTheDocument();
      expect(screen.getByText(/fulfilled/i)).toBeInTheDocument();
    });
  });

  it('renders Order Details with allocation explanation and pending fallback', async () => {
    const mockOrderUnallocated = {
      id: 401,
      status: 'pending',
      created_at: new Date().toISOString(),
      promised_delivery_date: '2026-10-30',
      business_notes: 'Urgent factory line maintenance',
      items: [
        {
          id: 501,
          product_name: 'Pressure Gauge Pro',
          sku: 'GAUGE-P300',
          product_sku: 'GAUGE-P300',
          requested_quantity: 25,
          minimum_acceptable_quantity: 15,
          partial_delivery_allowed: true,
          allocated_quantity: null,
          allocation_status: null,
          explanation: null,
        },
      ],
    };

    apiClient.get.mockImplementation((url) => {
      if (url.startsWith('/orders/401')) {
        return Promise.resolve({ data: mockOrderUnallocated });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter initialEntries={['/orders/401']}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Order #401/i })).toBeInTheDocument();
      expect(screen.getByText(/No allocation yet — pending allocation run/i)).toBeInTheDocument();
    });
  });
});
