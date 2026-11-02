import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('orderwise_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state by verifying token with /api/auth/me or checking demo preview query
  const initAuth = useCallback(async () => {
    if (typeof window !== 'undefined' && window.location) {
      try {
        const demoParam = new URLSearchParams(window.location.search).get('demo');
        if (demoParam === 'admin') {
          setUser({ id: 1, email: 'admin@orderwise.com', role: 'admin', name: 'Demo Administrator' });
          setLoading(false);
          return;
        }
        if (demoParam === 'customer') {
          setUser({ id: 2, email: 'alice@demo.com', role: 'customer', name: 'Alice Smith' });
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }
    }

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
    setError(null);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('orderwise_token', receivedToken);
      localStorage.setItem('orderwise_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return receivedUser;
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(message);
      throw err.response?.data || err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('orderwise_token', receivedToken);
      localStorage.setItem('orderwise_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return receivedUser;
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Registration failed. Please try again.';
      setError(message);
      throw err.response?.data || err;
    }
  };

  const logout = () => {
    localStorage.removeItem('orderwise_token');
    localStorage.removeItem('orderwise_user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
