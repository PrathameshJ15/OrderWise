import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('Frontend Customer Portal App Tests', () => {
  it('opens landing page on initial root visit with branding and navigation', async () => {
    localStorage.clear();
    render(<App />);

    expect(screen.getAllByText(/Order/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Allocate Smarter/i)).toBeInTheDocument();
    expect(screen.queryByText(/AI-Powered Procurement & Inventory Platform/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Launch Operations/i).length).toBeGreaterThan(0);
  });

  it('navigates to Login page when Launch Operations is clicked', async () => {
    localStorage.clear();
    render(<App />);

    const launchButtons = screen.getAllByText(/Launch Operations/i);
    fireEvent.click(launchButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });
  });
});
