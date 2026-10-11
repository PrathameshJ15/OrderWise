import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import Alerts from '../src/pages/admin/Alerts';
import Replenishment from '../src/pages/admin/Replenishment';
import apiClient from '../src/api/client';

vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('Frontend Phase 11: Supply Intelligence UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiClient.get.mockImplementation((url) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          data: {
            user: { id: 1, name: 'Admin User', role: 'admin', email: 'admin@orderwise.com' },
          },
        });
      }
      if (url === '/alerts') {
        return Promise.resolve({
          data: {
            alerts: [
              {
                id: 1,
                alert_type: 'below_reorder_point',
                severity: 'warning',
                title: 'Pressure Gauge Pro Below Reorder Point',
                description: 'Current inventory position (10 units) is below the configured reorder point (70 units).',
                suggested_action: 'Review replenishment recommendations and initiate purchase order.',
                product_name: 'Pressure Gauge Pro',
                product_sku: 'GAUGE-P300',
                resolved: false,
                created_at: new Date().toISOString(),
              },
            ],
            stats: {
              total: 1,
              unresolved: 1,
              critical: 0,
              warning: 1,
              info: 0,
            },
          },
        });
      }
      if (url === '/replenishment') {
        return Promise.resolve({
          data: {
            recommendations: [
              {
                product_id: 3,
                product_name: 'Pressure Gauge Pro',
                sku: 'GAUGE-P300',
                unit: 'units',
                current_stock: 40,
                reserved_quantity: 30,
                available_stock: 10,
                incoming_stock: 0,
                inventory_position: 10,
                reorder_point: 70,
                average_daily_demand: 8,
                supplier_lead_time_days: 14,
                safety_stock: 10,
                estimated_shortage_risk: 'high',
                suggested_reorder_quantity: 90,
                flag: 'REORDER_RECOMMENDED',
                formula_used: '(8 × 14) + 10 = 122 dynamic reorder point; position 10 <= 122',
                note: 'This is an estimate based on recent demand data.',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  describe('Alerts Command Center', () => {
    it('renders header, diagnostic scan button, and KPI stat counters', async () => {
      render(
        <AuthProvider>
          <MemoryRouter>
            <Alerts />
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText(/Supply Alerts Command/i)).toBeInTheDocument();
      expect(screen.getByText(/Run Diagnostic Scan/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/Pressure Gauge Pro Below Reorder Point/i)).toBeInTheDocument();
        expect(screen.getByText(/Suggested Action/i)).toBeInTheDocument();
        expect(screen.getByText(/Mark Resolved/i)).toBeInTheDocument();
      });
    });
  });

  describe('Replenishment Advisor', () => {
    it('renders formula badges, product catalog table, and reorder recommendation pills', async () => {
      render(
        <AuthProvider>
          <MemoryRouter>
            <Replenishment />
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText(/Replenishment Advisor/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/Tracked Catalog/i)).toBeInTheDocument();
      });

      // Find by text or test id
      expect(screen.getByText('Pressure Gauge Pro')).toBeInTheDocument();
      expect(screen.getByText('GAUGE-P300')).toBeInTheDocument();
      expect(screen.getAllByText(/REORDER RECOMMENDED/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/90 units/i)).toBeInTheDocument();
    });
  });
});
