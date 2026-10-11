import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('Frontend Customer Portal App Tests', () => {
  it('redirects unauthenticated users to the Login view with branding', async () => {
    localStorage.clear();
    render(<App />);

    expect(screen.getByText('OrderWise')).toBeInTheDocument();
    expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Demo Accounts/i)).toBeInTheDocument();
  });
});
