import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImpactAnalyzer from '../src/pages/admin/ImpactAnalyzer';
import apiClient from '../src/api/client';

describe('Phase 9 Frontend: ImpactAnalyzer Page Tests', () => {
  const mockRuns = [
    {
      id: 2,
      run_type: 'manual',
      status: 'completed',
      total_items_considered: 5,
      notes: 'Run 2: Stock Increase',
      created_at: '2026-10-11T12:05:00Z',
    },
    {
      id: 1,
      run_type: 'manual',
      status: 'completed',
      total_items_considered: 5,
      notes: 'Run 1: Initial Baseline',
      created_at: '2026-10-11T12:00:00Z',
    },
  ];

  const mockComparison = {
    base_run: {
      id: 1,
      run_type: 'manual',
      status: 'completed',
      total_items_considered: 5,
      created_at: '2026-10-11T12:00:00Z',
    },
    target_run: {
      id: 2,
      run_type: 'manual',
      status: 'completed',
      total_items_considered: 5,
      created_at: '2026-10-11T12:05:00Z',
    },
    summary: {
      total_items_compared: 5,
      total_changed: 2,
      total_unchanged: 3,
      improvements: 1,
      degradations: 1,
      by_classification: {
        IMPROVED: 0,
        DEGRADED: 1,
        UNCHANGED: 3,
        NEWLY_FULFILLED: 1,
        NEWLY_DEFERRED: 0,
        NEW_ITEM: 0,
        REMOVED_ITEM: 0,
      },
    },
    changes: [
      {
        order_item_id: 101,
        order_id: 12,
        customer_name: 'Alice Corp',
        product_name: 'Pressure Gauge Pro',
        sku: 'GAUGE-P300',
        requested_quantity: 25,
        minimum_acceptable_quantity: 15,
        previous_allocated: 0,
        current_allocated: 25,
        delta: 25,
        previous_status: 'deferred',
        current_status: 'fulfilled',
        changed: true,
        classification: 'NEWLY_FULFILLED',
        change_direction: 'improved',
        explanation: 'Stock increased allowing minimum acceptable quantity to be fulfilled.',
        cause_description: 'Stock for Pressure Gauge Pro increased by 50 units.',
        cause_attribution: {
          cause_type: 'STOCK_INCREASED',
          trigger_event: { source: 'audit_logs', id: 45, action: 'INVENTORY_ADJUSTED' },
        },
      },
      {
        order_item_id: 102,
        order_id: 14,
        customer_name: 'Bob Logistics',
        product_name: 'Pressure Gauge Pro',
        sku: 'GAUGE-P300',
        requested_quantity: 20,
        previous_allocated: 20,
        current_allocated: 10,
        delta: -10,
        previous_status: 'fulfilled',
        current_status: 'partially_fulfilled',
        changed: true,
        classification: 'DEGRADED',
        change_direction: 'degraded',
        explanation: 'Higher-priority order arrived and claimed stock.',
        cause_description: 'Competing higher-priority order consumed available stock.',
        cause_attribution: {
          cause_type: 'COMPETING_ORDER_PRIORITY',
          trigger_event: null,
        },
      },
      {
        order_item_id: 103,
        order_id: 15,
        customer_name: 'Charlie Heavy Industries',
        product_name: 'Safety Valve Type B',
        sku: 'VALVE-B200',
        requested_quantity: 30,
        previous_allocated: 30,
        current_allocated: 30,
        delta: 0,
        previous_status: 'fulfilled',
        current_status: 'fulfilled',
        changed: false,
        classification: 'UNCHANGED',
        change_direction: 'unchanged',
        explanation: 'Allocation remained unchanged across runs.',
        cause_description: 'Allocation remained unchanged across runs.',
        cause_attribution: {
          cause_type: 'STABLE',
          trigger_event: null,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get = vi.fn().mockImplementation((url) => {
      if (url === '/impact/runs') {
        return Promise.resolve({ success: true, data: { runs: mockRuns } });
      }
      if (url.startsWith('/impact/compare')) {
        return Promise.resolve({ success: true, data: mockComparison });
      }
      return Promise.resolve({ success: true, data: {} });
    });
    apiClient.post = vi.fn().mockResolvedValue({ success: true, data: {} });
  });

  it('renders Impact Analyzer header, summary KPI cards, and run comparison details', async () => {
    render(<ImpactAnalyzer />);

    expect(screen.getByText(/PHASE 9 ALLOCATION IMPACT ANALYZER/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Allocation Impact/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Corp')).toBeInTheDocument();
      expect(screen.getByText('Bob Logistics')).toBeInTheDocument();
      expect(screen.getByText('Charlie Heavy Industries')).toBeInTheDocument();
    });

    // Check KPI counts & badges
    expect(screen.getAllByText('Newly Fulfilled').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Improved Qty')).toBeInTheDocument();
    expect(screen.getByText('Degraded Qty')).toBeInTheDocument();

    expect(screen.getAllByText('Degraded').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Unchanged').length).toBeGreaterThanOrEqual(1);

    // Check Deltas
    expect(screen.getByText('+25')).toBeInTheDocument();
    expect(screen.getByText('-10')).toBeInTheDocument();

    // Check Cause Attribution
    expect(screen.getByText('STOCK INCREASED')).toBeInTheDocument();
    expect(screen.getByText(/Audit #45/i)).toBeInTheDocument();
  });

  it('filters table rows when classification filter is changed', async () => {
    render(<ImpactAnalyzer />);

    await waitFor(() => {
      expect(screen.getByText('Alice Corp')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: /Filter by classification/i });
    // Change filter to DEGRADED
    fireEvent.change(select, { target: { value: 'DEGRADED' } });

    await waitFor(() => {
      expect(screen.getByText('Bob Logistics')).toBeInTheDocument();
      expect(screen.queryByText('Alice Corp')).not.toBeInTheDocument();
      expect(screen.queryByText('Charlie Heavy Industries')).not.toBeInTheDocument();
    });
  });

  it('clicking Compare Latest Runs re-fetches comparison from API', async () => {
    render(<ImpactAnalyzer />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Compare Latest Runs/i })).toBeInTheDocument();
    });

    const compareBtn = screen.getByRole('button', { name: /Compare Latest Runs/i });
    fireEvent.click(compareBtn);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/impact/compare?baseRun=1&targetRun=2');
    });
  });
});
