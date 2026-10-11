import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('orderwise_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state by verifying token with /api/auth/me
  const initAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('orderwise_token');
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data.user);
      setToken(storedToken);
    } catch {
      localStorage.removeItem('orderwise_token');
      localStorage.removeItem('orderwise_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    // Listen for unauthorized events emitted by apiClient
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setError('Your session has expired. Please log in again.');
    };

    window.addEventListener('orderwise:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('orderwise:unauthorized', handleUnauthorized);
    };
  }, [initAuth]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user: loggedInUser, token: authToken } = res.data;

      localStorage.setItem('orderwise_token', authToken);
      localStorage.setItem('orderwise_user', JSON.stringify(loggedInUser));

      setUser(loggedInUser);
      setToken(authToken);
      return loggedInUser;
    } catch (err) {
      const msg = err?.error?.message || err?.message || 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      const { user: registeredUser, token: authToken } = res.data;

      localStorage.setItem('orderwise_token', authToken);
      localStorage.setItem('orderwise_user', JSON.stringify(registeredUser));

      setUser(registeredUser);
      setToken(authToken);
      return registeredUser;
    } catch (err) {
      const msg = err?.error?.message || err?.message || 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('orderwise_token');
      localStorage.removeItem('orderwise_user');
      setUser(null);
      setToken(null);
      setError(null);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'inventory_manager',
    isCustomer: user?.role === 'customer',
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
