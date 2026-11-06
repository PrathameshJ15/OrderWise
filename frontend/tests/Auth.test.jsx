import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import Login from '../src/pages/Login';
import Register from '../src/pages/Register';

describe('Frontend Authentication UI & Flow Tests', () => {
  it('renders login page with input fields and authenticate button', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Sign In to OrderWise/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@company.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeInTheDocument();
    expect(screen.getByText(/Authenticate Session/i)).toBeInTheDocument();
  });

  it('allows user to enter email and password credentials', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/name@company.com/i);
    const passInput = screen.getByPlaceholderText(/••••••••••••/i);

    fireEvent.change(emailInput, { target: { value: 'alice@demo.com' } });
    fireEvent.change(passInput, { target: { value: 'Alice123!' } });

    expect(emailInput.value).toBe('alice@demo.com');
    expect(passInput.value).toBe('Alice123!');
  });

  it('renders registration form with password security policy indicators', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Create OrderWise Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Password Security Policy:/i)).toBeInTheDocument();
    expect(screen.getByText(/At least 8 characters long/i)).toBeInTheDocument();
    expect(screen.getByText(/Contains letters/i)).toBeInTheDocument();
    expect(screen.getByText(/Contains at least one number/i)).toBeInTheDocument();
  });

  it('displays error on register if passwords do not match', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Acme Industrial Corp/i), {
      target: { value: 'Test Corp' },
    });
    fireEvent.change(screen.getByPlaceholderText(/purchasing@acme.example/i), {
      target: { value: 'test@corp.example' },
    });
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••••••/i);
    fireEvent.change(passwordInputs[0], { target: { value: 'Password123!' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'Mismatch999!' } });

    fireEvent.click(screen.getByText(/Complete Customer Registration/i));

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });
});
