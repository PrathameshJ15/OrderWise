import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import PlaceholderLayout from './components/layout/PlaceholderLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PlaceholderLayout />}>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer authenticated routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<CustomerDashboard />} />
              </Route>

              {/* Admin authenticated & role-gated routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<RoleRoute allowedRoles={['admin', 'inventory_manager']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
