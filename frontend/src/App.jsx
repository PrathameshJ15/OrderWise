import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ProtectedRoute from './components/layout/ProtectedRoute';
import CustomerLayout from './components/layout/CustomerLayout';
import AdminLayout from './components/layout/AdminLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ProductCatalog from './pages/customer/ProductCatalog';
import CreateOrder from './pages/customer/CreateOrder';
import MyOrders from './pages/customer/MyOrders';
import OrderDetail from './pages/customer/OrderDetail';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import OrderManagement from './pages/admin/OrderManagement';
import AllocationCenter from './pages/admin/AllocationCenter';
import AIRecommendations from './pages/admin/AIRecommendations';
import ImpactAnalyzer from './pages/admin/ImpactAnalyzer';
import SimulationLab from './pages/admin/SimulationLab';
import Alerts from './pages/admin/Alerts';
import Replenishment from './pages/admin/Replenishment';
import Reports from './pages/admin/Reports';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Portal Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <CustomerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/products" element={<ProductCatalog />} />
              <Route path="/orders/new" element={<CreateOrder />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
            </Route>

            {/* Admin Portal Protected Routes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['admin', 'inventory_manager']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<ProductManagement />} />
              <Route path="/admin/inventory" element={<InventoryManagement />} />
              <Route path="/admin/orders" element={<OrderManagement />} />
              <Route path="/admin/allocation" element={<AllocationCenter />} />
              <Route path="/admin/ai" element={<AIRecommendations />} />
              <Route path="/admin/impact" element={<ImpactAnalyzer />} />
              <Route path="/admin/simulations" element={<SimulationLab />} />
              <Route path="/admin/alerts" element={<Alerts />} />
              <Route path="/admin/replenishment" element={<Replenishment />} />
              <Route path="/admin/reports" element={<Reports />} />
            </Route>

            {/* Default Redirection */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
