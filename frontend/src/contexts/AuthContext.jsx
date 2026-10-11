import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('orderwise_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get('/auth/me');
      const userData = res.user || res.data || res;
      setUser(userData);
    } catch (err) {
      console.warn('Failed to fetch authenticated user:', err);
      localStorage.removeItem('orderwise_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const token = res.token || res.data?.token;
    const userData = res.user || res.data?.user;

    if (token) {
      localStorage.setItem('orderwise_token', token);
    }
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await apiClient.post('/auth/register', { name, email, password });
    const token = res.token || res.data?.token;
    const userData = res.user || res.data?.user;

    if (token) {
      localStorage.setItem('orderwise_token', token);
    }
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('orderwise_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
