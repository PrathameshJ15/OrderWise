import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import apiClient from '../src/api/client';
import { AuthContext } from '../src/contexts/AuthContext';
import StatusPill from '../src/components/ui/StatusPill';
import ProductCatalog from '../src/pages/customer/ProductCatalog';
import CreateOrder from '../src/pages/customer/CreateOrder';
import CustomerDashboard from '../src/pages/customer/CustomerDashboard';
import OrderDetail from '../src/pages/customer/OrderDetail';
import Login from '../src/pages/Login';
import Register from '../src/pages/Register';

const mockCustomer = {
  id: 3,
  name: 'Alice Smith Corp',
  email: 'alice@demo.com',
  role: 'customer',
};

const mockAuthContextValue = {
  user: mockCustomer,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  isAuthenticated: true,
};

function renderWithAuth(ui, authValue = mockAuthContextValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
}

describe('Customer Portal Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StatusPill Component', () => {
    it('renders correct labels and color indicators for allocation statuses', () => {
      const { rerender } = render(<StatusPill status="fulfilled" />);
      expect(screen.getByText('Fulfilled')).toBeInTheDocument();

      rerender(<StatusPill status="partially_fulfilled" />);
      expect(screen.getByText('Partially Fulfilled')).toBeInTheDocument();

      rerender(<StatusPill status="deferred" />);
      expect(screen.getByText('Deferred')).toBeInTheDocument();

      rerender(<StatusPill status="pending" />);
      expect(screen.getByText('Pending Allocation')).toBeInTheDocument();
    });

    it('renders priority pills with designated color classes', () => {
      const { rerender } = render(<StatusPill status="CRITICAL" type="priority" />);
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();

      rerender(<StatusPill status="HIGH" type="priority" />);
      expect(screen.getByText('HIGH')).toBeInTheDocument();

      rerender(<StatusPill status="MEDIUM" type="priority" />);
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();

      rerender(<StatusPill status="LOW" type="priority" />);
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });
  });

  describe('Login & Register Pages', () => {
    it('validates email and password on Login submission', async () => {
      renderWithAuth(<Login />, { ...mockAuthContextValue, user: null });

      const submitBtn = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/Email address is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
    });

    it('validates password match on Register', async () => {
      renderWithAuth(<Register />, { ...mockAuthContextValue, user: null });

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passInput = screen.getByLabelText(/^Password/i);
      const confirmInput = screen.getByLabelText(/Confirm Password/i);

      fireEvent.change(nameInput, { target: { value: 'New User Corp' } });
      fireEvent.change(emailInput, { target: { value: 'new@user.com' } });
      fireEvent.change(passInput, { target: { value: 'Pass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'Mismatch123!' } });

      const submitBtn = screen.getByRole('button', { name: /Create Account/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  describe('CustomerDashboard Component', () => {
    it('displays real counts for total, pending, fulfilled, partially fulfilled, and deferred', async () => {
      vi.spyOn(apiClient, 'get').mockImplementation((url) => {
        if (url.includes('/orders/stats/my')) {
          return Promise.resolve({
            success: true,
            stats: {
              total: 12,
              pending: 3,
              fulfilled: 5,
              partially_fulfilled: 4,
              deferred: 1,
            },
          });
        }
        if (url.includes('/orders/my')) {
          return Promise.resolve({
            success: true,
            orders: [
              {
                id: 101,
                created_at: new Date().toISOString(),
                promised_delivery_date: '2026-10-30',
                display_status: 'fulfilled',
                items: [{ requested_quantity: 20 }],
              },
            ],
          });
        }
        return Promise.resolve({ success: true, data: {} });
      });

      renderWithAuth(<CustomerDashboard />);

      // Await counts to render
      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });

      expect(screen.getByText(/Total Orders/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending Allocation/i)).toBeInTheDocument();
      expect(screen.getByText(/Partially Fulfilled/i)).toBeInTheDocument();
      expect(screen.getByText(/#101/i)).toBeInTheDocument();
    });
  });

  describe('ProductCatalog Component', () => {
    it('renders products and filters dynamically by search query and stock', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        success: true,
        products: [
          {
            id: 1,
            sku: 'PUMP-X100',
            name: 'Industrial Pump Model X',
            description: 'Heavy duty fluid extraction pump',
            unit: 'units',
            on_hand_quantity: 150,
            reserved_quantity: 0,
            available_stock: 150,
          },
          {
            id: 3,
            sku: 'GAUGE-P300',
            name: 'Pressure Gauge Pro',
            description: 'High-precision digital gauge (Scarce)',
            unit: 'units',
            on_hand_quantity: 40,
            reserved_quantity: 35,
            available_stock: 5,
          },
        ],
      });

      renderWithAuth(<ProductCatalog />);

      await waitFor(() => {
        expect(screen.getByText('Industrial Pump Model X')).toBeInTheDocument();
        expect(screen.getByText('Pressure Gauge Pro')).toBeInTheDocument();
      });

      // Filter by search query
      const searchInput = screen.getByLabelText(/Search products/i);
      fireEvent.change(searchInput, { target: { value: 'Pump' } });

      expect(screen.getByText('Industrial Pump Model X')).toBeInTheDocument();
      expect(screen.queryByText('Pressure Gauge Pro')).not.toBeInTheDocument();
    });
  });

  describe('CreateOrder Component', () => {
    it('enforces validation when minimum quantity exceeds requested quantity', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        success: true,
        products: [
          { id: 1, sku: 'PUMP-X100', name: 'Industrial Pump Model X', available_stock: 50, on_hand_quantity: 50 },
        ],
      });

      renderWithAuth(<CreateOrder />);

      await waitFor(() => {
        expect(screen.getByText(/Line Items & Allocation Rules/i)).toBeInTheDocument();
      });

      // Change requested to 10 and min to 20
      const reqInput = screen.getByLabelText(/Requested Qty/i);
      const minInput = screen.getByLabelText(/Min Acceptable/i);

      // Attempt to input min greater than requested
      fireEvent.change(reqInput, { target: { value: '10' } });
      fireEvent.change(minInput, { target: { value: '25' } });

      const submitBtn = screen.getByRole('button', { name: /Submit Order/i });
      fireEvent.click(submitBtn);

      // Verify validation triggers
      expect(screen.getByText(/Line Items & Allocation Rules/i)).toBeInTheDocument();
    });

    it('syncs minimum acceptable quantity to requested quantity when partial delivery is unchecked', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        success: true,
        products: [
          { id: 1, sku: 'PUMP-X100', name: 'Industrial Pump Model X', available_stock: 50, on_hand_quantity: 50 },
        ],
      });

      renderWithAuth(<CreateOrder />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Partial OK/i)).toBeInTheDocument();
      });

      const reqInput = screen.getByLabelText(/Requested Qty/i);
      const partialCheckbox = screen.getByLabelText(/Partial OK/i);
      const minInput = screen.getByLabelText(/Min Acceptable/i);

      fireEvent.change(reqInput, { target: { value: '15' } });
      // Uncheck partial delivery
      fireEvent.click(partialCheckbox);

      expect(partialCheckbox.checked).toBe(false);
      expect(minInput.value).toBe('15');
      expect(minInput).toBeDisabled();
    });
  });

  describe('OrderDetail Component', () => {
    it('renders customer-friendly status timeline and displays "No allocation yet" when allocation is null', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        success: true,
        order: {
          id: 42,
          customer_id: 3,
          status: 'pending',
          display_status: 'pending',
          promised_delivery_date: '2026-11-01',
          created_at: new Date().toISOString(),
          business_notes: 'Urgent refinery replacement',
          priority: 'HIGH',
          timeline: [
            { key: 'submitted', title: 'Order Placed', description: 'Order submitted.', status: 'completed' },
            { key: 'priority', title: 'Priority Evaluated', description: 'Priority HIGH assigned.', status: 'completed' },
            { key: 'allocation', title: 'Inventory Allocation', description: 'Waiting for allocation cycle.', status: 'in_progress' },
            { key: 'fulfillment', title: 'Fulfillment & Dispatch', description: 'Pending allocation.', status: 'pending' },
          ],
          items: [
            {
              id: 99,
              product_id: 1,
              product_name: 'Industrial Pump Model X',
              product_sku: 'PUMP-X100',
              product_unit: 'units',
              requested_quantity: 20,
              minimum_acceptable_quantity: 10,
              partial_delivery_allowed: true,
              latest_allocation: null, // explicit: NO ALLOCATION YET!
            },
          ],
        },
      });

      renderWithAuth(<OrderDetail />);

      await waitFor(() => {
        expect(screen.getByText('Order #42')).toBeInTheDocument();
      });

      // Verify timeline steps
      expect(screen.getByText('Order Placed')).toBeInTheDocument();
      expect(screen.getByText('Priority Evaluated')).toBeInTheDocument();
      expect(screen.getByText('Inventory Allocation')).toBeInTheDocument();

      // Verify "No allocation yet" message instead of invented result!
      expect(screen.getByText('No allocation yet')).toBeInTheDocument();
      expect(screen.getByText(/Awaiting Allocation Run/i)).toBeInTheDocument();
      expect(screen.getByText(/never invents or approximates unverified quantities/i)).toBeInTheDocument();
    });

    it('renders allocation details and "Why was this item deferred?" explanation for deferred item', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        success: true,
        order: {
          id: 43,
          customer_id: 3,
          status: 'pending',
          display_status: 'deferred',
          created_at: new Date().toISOString(),
          priority: 'MEDIUM',
          timeline: [
            { key: 'submitted', title: 'Order Placed', description: 'Order submitted.', status: 'completed' },
            { key: 'allocation', title: 'Inventory Allocation Processed', description: 'Deferred.', status: 'completed' },
          ],
          items: [
            {
              id: 100,
              product_name: 'Pressure Gauge Pro',
              product_sku: 'GAUGE-P300',
              product_unit: 'units',
              requested_quantity: 25,
              minimum_acceptable_quantity: 15,
              partial_delivery_allowed: true,
              latest_allocation: {
                allocated_quantity: 0,
                status: 'deferred',
                explanation: 'Available stock (10 units) is below the minimum acceptable quantity (15 units). No allocation made.',
                run_at: new Date().toISOString(),
              },
            },
          ],
        },
      });

      renderWithAuth(<OrderDetail />);

      await waitFor(() => {
        expect(screen.getByText('Order #43')).toBeInTheDocument();
      });

      expect(screen.getByText('Allocated Units:')).toBeInTheDocument();
      expect(screen.getByText('0 of 25')).toBeInTheDocument();
      expect(screen.getByText(/Why was this item deferred\?/i)).toBeInTheDocument();
      expect(screen.getAllByText(/below the minimum acceptable quantity/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
