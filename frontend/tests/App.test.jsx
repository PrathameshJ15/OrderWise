import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('Frontend Foundation Smoke Tests', () => {
  it('renders application branding and header elements', async () => {
    render(<App />);
    expect(screen.getByText('OrderWise')).toBeInTheDocument();
    expect(screen.getByText(/VORTEXA 3.0/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/API Connected/i)).toBeInTheDocument();
    });
  });

  it('renders Phase 1 Foundation Verification banner', async () => {
    render(<App />);
    expect(screen.getByText(/Phase 1 Foundation Verification/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Uptime:/i)).toBeInTheDocument();
    });
  });
});
