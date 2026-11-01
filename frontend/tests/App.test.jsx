import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('Frontend Customer Portal App Tests', () => {
  it('opens landing page on initial root visit with branding and navigation', async () => {
    localStorage.clear();
    render(<App />);

    expect(screen.getAllByText(/Order/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Deterministic Order Allocation/i)).toBeInTheDocument();
    expect(screen.getByText(/VORTEXA 3.0 • Problem Statement S-03/i)).toBeInTheDocument();
    expect(screen.getByText(/Launch Operations Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to 1-Click Login/i)).toBeInTheDocument();
  });

  it('navigates to Login page when Launch Operations Portal is clicked', async () => {
    localStorage.clear();
    render(<App />);

    const launchButton = screen.getByText(/Launch Operations Portal/i);
    fireEvent.click(launchButton);

    await waitFor(() => {
      expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByText(/Quick Demo Accounts/i)).toBeInTheDocument();
    });
  });
});
