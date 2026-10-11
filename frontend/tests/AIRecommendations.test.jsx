import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIRecommendations from '../src/pages/admin/AIRecommendations';
import apiClient from '../src/api/client';

describe('AIRecommendations Page Tests', () => {
  const mockOrders = [
    {
      id: 7,
      customer_id: 2,
      customer_name: 'Alice Johnson Corp',
      customer_email: 'alice@demo.com',
      status: 'pending',
      promised_delivery_date: '2026-10-20',
      business_notes: 'Urgent equipment failure at Site 3',
      approved_priority: 'MEDIUM',
      priority_rank: 2,
      items: [
        {
          id: 11,
          product_name: 'Pressure Gauge Pro',
          sku: 'GAUGE-P300',
          requested_quantity: 25,
          minimum_acceptable_quantity: 15,
        },
      ],
      latest_recommendation: {
        id: 5,
        order_id: 7,
        suggested_priority: 'CRITICAL',
        suggested_rank: 4,
        confidence: 'high',
        explanation: 'Active equipment failure with shutdown risk warrants immediate critical classification.',
        evidence: 'Urgent equipment failure at Site 3',
        warning: null,
        provider: 'groq',
        model: 'llama3-70b-8192',
        prompt_version: 'v1.0.0',
        status: 'pending',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get = vi.fn().mockImplementation((url) => {
      if (url === '/orders') {
        return Promise.resolve({ success: true, data: { orders: mockOrders } });
      }
      return Promise.resolve({ success: true, data: {} });
    });
    apiClient.post = vi.fn().mockImplementation((url, body) => {
      if (url === '/auth/login') {
        return Promise.resolve({ success: true, data: { token: 'mock_jwt_token' } });
      }
      if (url === '/priorities/approve') {
        return Promise.resolve({
          success: true,
          data: {
            approval: { id: 1, decision: body.decision },
            order_priority: { order_id: 7, approved_priority: body.final_priority || 'CRITICAL' },
          },
        });
      }
      return Promise.resolve({ success: true, data: {} });
    });
  });

  it('renders AI Priority Assistant title, stats, and orders with recommendations', async () => {
    render(<AIRecommendations />);

    expect(screen.getByText(/AI Priority Assistant/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/ORDER #7/i)).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson Corp')).toBeInTheDocument();
    });

    // Verify recommendation details rendered
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText(/Confidence: high/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Active equipment failure with shutdown risk/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Urgent equipment failure at Site 3/i).length).toBeGreaterThanOrEqual(1);

    // Verify Traceability: Model name and Prompt version
    expect(screen.getByText(/Model: llama3-70b-8192/i)).toBeInTheDocument();
    expect(screen.getByText(/Prompt: v1.0.0/i)).toBeInTheDocument();

    // Verify action buttons
    expect(screen.getByRole('button', { name: /^Approve$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Modify$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Reject$/i })).toBeInTheDocument();
  });

  it('clicking Approve calls /api/priorities/approve with decision "approved"', async () => {
    render(<AIRecommendations />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Approve$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Approve$/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/priorities/approve', {
        recommendation_id: 5,
        decision: 'approved',
        reason: expect.any(String),
      });
    });
  });

  it('clicking Reject calls /api/priorities/approve with decision "rejected"', async () => {
    render(<AIRecommendations />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Reject$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Reject$/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/priorities/approve', {
        recommendation_id: 5,
        decision: 'rejected',
        reason: expect.any(String),
      });
    });
  });

  it('clicking Modify opens modal and submitting updates priority with rationale', async () => {
    render(<AIRecommendations />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Modify$/i })).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /^Modify$/i }));

    expect(screen.getByText(/Modify AI Priority Recommendation/i)).toBeInTheDocument();

    // Fill in override rationale
    const textarea = screen.getByPlaceholderText(/VIP client SLA requires/i);
    fireEvent.change(textarea, { target: { value: 'Contractual escalation from management' } });

    // Submit modification
    fireEvent.click(screen.getByRole('button', { name: /Confirm Modification/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/priorities/approve', {
        recommendation_id: 5,
        decision: 'overridden',
        final_priority: expect.any(String),
        override_reason: 'Contractual escalation from management',
      });
    });
  });
});
