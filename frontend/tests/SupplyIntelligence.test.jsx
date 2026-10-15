import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Alerts from '../src/pages/admin/Alerts';
import Replenishment from '../src/pages/admin/Replenishment';
import apiClient from '../src/api/client';

describe('Phase 11 Frontend: Alerts Page Tests', () => {
  const mockAlertsData = {
    alerts: [
      {
        id: 1,
        alert_type: 'low_stock',
        severity: 'critical',
        title: 'Low Stock Warning: Pressure Gauge Pro (GAUGE-P300)',
        description: 'Available stock (5 units) has dropped below safety stock threshold (10 units).',
        product_id: 3,
        product_name: 'Pressure Gauge Pro',
        sku: 'GAUGE-P300',
        status: 'active',
        recommended_action: 'Place replenishment order with primary supplier immediately.',
        created_at: '2026-10-11T12:00:00Z',
        metadata: { inventoryPosition: 5 },
      },
      {
        id: 2,
        alert_type: 'supplier_delay',
        severity: 'warning',
        title: 'Supplier Delivery Delayed: PO-10023',
        description: 'Purchase order PO-10023 is overdue by 3 days.',
        status: 'acknowledged',
        recommended_action: 'Contact GaugeMaster Instruments to expedite shipment tracking.',
        created_at: '2026-10-11T11:00:00Z',
      },
    ],
    summary: {
      total: 2,
      active_count: 1,
      acknowledged_count: 1,
      resolved_count: 0,
      critical_unresolved: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get = vi.fn().mockImplementation((url) => {
      if (url.startsWith('/alerts')) {
        return Promise.resolve({ success: true, data: mockAlertsData });
      }
      return Promise.resolve({ success: true, data: {} });
    });
    apiClient.post = vi.fn().mockResolvedValue({ success: true, data: {} });
    apiClient.patch = vi.fn().mockResolvedValue({ success: true, data: { alert: { status: 'acknowledged' } } });
  });

  it('renders alerts header, KPI summaries, and alert stream with recommended actions', async () => {
    render(
      <BrowserRouter>
        <Alerts />
      </BrowserRouter>
    );

    expect(screen.getByText(/PHASE 11 SUPPLY INTELLIGENCE/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Supply Alerts/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Low Stock Warning: Pressure Gauge Pro/i)).toBeInTheDocument();
      expect(screen.getByText(/Place replenishment order with primary supplier immediately/i)).toBeInTheDocument();
    });

    // Check KPI counts
    expect(screen.getByText(/Critical Unresolved/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Alerts/i)).toBeInTheDocument();

    // Check severity badge
    expect(screen.getAllByText('Critical').length).toBeGreaterThanOrEqual(1);
  });

  it('allows acknowledging an active alert', async () => {
    render(
      <BrowserRouter>
        <Alerts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Acknowledge$/i })).toBeInTheDocument();
    });

    const ackButton = screen.getByRole('button', { name: /^Acknowledge$/i });
    fireEvent.click(ackButton);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/alerts/1/acknowledge');
    });
  });

  it('allows triggering alert condition scanner', async () => {
    render(
      <BrowserRouter>
        <Alerts />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Scan Conditions Now/i })).toBeInTheDocument();
    });

    const scanButton = screen.getByRole('button', { name: /Scan Conditions Now/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/alerts/scan');
    });
  });
});

describe('Phase 11 Frontend: Replenishment Page Tests', () => {
  const mockReplenishmentData = {
    demand_period_days: 30,
    recommendations: [
      {
        product_id: 3,
        sku: 'GAUGE-P300',
        product_name: 'Pressure Gauge Pro',
        unit: 'units',
        on_hand_quantity: 40,
        reserved_quantity: 30,
        available_stock: 10,
        confirmed_incoming: 0,
        inventory_position: 10,
        safety_stock: 10,
        effective_reorder_point: 45,
        calculated_reorder_point: 45,
        average_daily_demand: 2.5,
        lead_time_days: 14,
        needs_replenishment: true,
        suggested_reorder_quantity: 58,
        shortage_risk: 'high',
        is_estimate: true,
        has_sufficient_demand_history: true,
        supplier: { id: 2, name: 'GaugeMaster Instruments', code: 'SUP-GAUGEMASTER' },
      },
      {
        product_id: 4,
        sku: 'CTRL-U400',
        product_name: 'Control Panel Unit',
        unit: 'units',
        on_hand_quantity: 200,
        reserved_quantity: 0,
        available_stock: 200,
        confirmed_incoming: 0,
        inventory_position: 200,
        safety_stock: 25,
        effective_reorder_point: 50,
        calculated_reorder_point: 35,
        average_daily_demand: 1.0,
        lead_time_days: 10,
        needs_replenishment: false,
        suggested_reorder_quantity: 0,
        shortage_risk: 'low',
        is_estimate: true,
        has_sufficient_demand_history: false,
        limitation_note: 'Insufficient demand history (< 2 orders). Label values as estimates.',
        supplier: { id: 3, name: 'HydraCore Pumps & Drives', code: 'SUP-HYDRACORE' },
      },
    ],
  };

  const mockPOs = [
    {
      id: 5,
      po_number: 'PO-20091',
      supplier_name: 'GaugeMaster Instruments',
      supplier_code: 'SUP-GAUGEMASTER',
      status: 'draft',
      expected_delivery_date: '2026-10-25',
      created_at: '2026-10-11T12:00:00Z',
      items: [{ id: 1, product_name: 'Pressure Gauge Pro', quantity_ordered: 50 }],
    },
  ];

  const mockSuppliers = [
    { id: 2, name: 'GaugeMaster Instruments', code: 'SUP-GAUGEMASTER', lead_time_days: 14 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get = vi.fn().mockImplementation((url) => {
      if (url.startsWith('/replenishment/pos')) {
        return Promise.resolve({ success: true, data: { purchase_orders: mockPOs } });
      }
      if (url.startsWith('/replenishment/suppliers')) {
        return Promise.resolve({ success: true, data: { suppliers: mockSuppliers } });
      }
      if (url.startsWith('/replenishment')) {
        return Promise.resolve({ success: true, data: mockReplenishmentData });
      }
      return Promise.resolve({ success: true, data: {} });
    });
    apiClient.post = vi.fn().mockResolvedValue({ success: true, data: { purchase_order: { id: 6, status: 'draft' } } });
    apiClient.patch = vi.fn().mockResolvedValue({ success: true, data: { purchase_order: { id: 5, status: 'ordered' } } });
  });

  it('renders replenishment recommendations, limitation notes, and reorder point formulas', async () => {
    render(
      <BrowserRouter>
        <Replenishment />
      </BrowserRouter>
    );

    expect(screen.getByText(/PHASE 11 SUPPLY INTELLIGENCE/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Replenishment/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Pressure Gauge Pro')).toBeInTheDocument();
      expect(screen.getByText('Control Panel Unit')).toBeInTheDocument();
    });

    // Check inventory position indicator
    expect(screen.getByText('10')).toBeInTheDocument();

    // Check limitation banner
    expect(screen.getByText(/Insufficient demand history/i)).toBeInTheDocument();

    // Check Draft PO button
    expect(screen.getAllByRole('button', { name: /Draft PO/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('allows opening Draft PO modal and submitting a draft purchase order', async () => {
    render(
      <BrowserRouter>
        <Replenishment />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Draft PO/i }).length).toBeGreaterThanOrEqual(1);
    });

    // Click Draft PO button for first item
    fireEvent.click(screen.getAllByRole('button', { name: /Draft PO/i })[0]);

    // Modal should appear
    expect(screen.getByText(/Generate Draft Purchase Order/i)).toBeInTheDocument();

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Create Draft PO/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/replenishment/draft-po',
        expect.objectContaining({
          items: expect.arrayContaining([expect.objectContaining({ product_id: 3 })]),
        })
      );
    });
  });

  it('switches to Purchase Orders tab and approves a draft purchase order', async () => {
    render(
      <BrowserRouter>
        <Replenishment />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Purchase Orders & Approvals/i })).toBeInTheDocument();
    });

    // Switch tab
    fireEvent.click(screen.getByRole('button', { name: /Purchase Orders & Approvals/i }));

    await waitFor(() => {
      expect(screen.getByText('PO-20091')).toBeInTheDocument();
      expect(screen.getByText(/Draft \(Awaiting Approval\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Approve PO/i })).toBeInTheDocument();
    });

    // Click Approve PO button
    fireEvent.click(screen.getByRole('button', { name: /Approve PO/i }));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith('/replenishment/po/5/approve');
    });
  });
});
