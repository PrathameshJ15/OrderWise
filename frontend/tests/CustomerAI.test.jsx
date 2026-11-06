import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import CustomerAIAssistant from '../src/pages/customer/CustomerAIAssistant';
import ProductCatalog from '../src/pages/customer/ProductCatalog';
import CreateOrder from '../src/pages/customer/CreateOrder';
import apiClient from '../src/api/client';

vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('Customer AI Capabilities Frontend Tests', () => {
  it('renders Customer AI Assistant with greeting and suggested prompt pills', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <CustomerAIAssistant />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/AI Order Assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/OrderWise Supply Chain Assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/What is my current order status\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Why was my order partially allocated\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about your order status/i)).toBeInTheDocument();
  });

  it('renders Product Catalog with AI recommendations strip when available', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/products')) {
        return Promise.resolve({
          data: [
            { id: 1, sku: 'PLC-001', name: 'PLC Control Module', category: 'Industrial Automation', unit: 'Piece', price: '850.00', on_hand_quantity: 120, available_quantity: 120 },
            { id: 2, sku: 'IPS-002', name: 'Industrial Pressure Sensor', category: 'Sensors', unit: 'Piece', price: '320.00', on_hand_quantity: 40, available_quantity: 40 },
          ],
        });
      }
      if (url.includes('/customer/ai/recommendations')) {
        return Promise.resolve({
          data: {
            recommendations: [
              {
                id: 3,
                sku: 'SVM-003',
                name: 'Servo Motor',
                category: 'Motors & Drives',
                unit: 'Piece',
                price: '550.00',
                available_stock: 90,
                reason: 'Companion for recent automation orders',
              },
            ],
          },
        });
      }
      return Promise.reject(new Error('not found'));
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <ProductCatalog />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/PLC Control Module/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Recommended For Your Facility/i)).toBeInTheDocument();
      expect(screen.getByText(/Servo Motor/i)).toBeInTheDocument();
      expect(screen.getByText(/Companion for recent automation orders/i)).toBeInTheDocument();
    });
  });

  it('renders AI Natural Language Order Builder on CreateOrder page', async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { id: 1, sku: 'PLC-001', name: 'PLC Control Module', category: 'Industrial Automation', unit: 'Piece', price: '850.00' },
      ],
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <CreateOrder />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/AI Order Creation Assistant/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/I need 20 PLC Control Modules/i)).toBeInTheDocument();
      expect(screen.getByText(/Generate Draft/i)).toBeInTheDocument();
    });
  });
});
