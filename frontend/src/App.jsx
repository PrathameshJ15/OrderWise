import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './contexts/I18nContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ProtectedRoute from './components/layout/ProtectedRoute';
import CustomerLayout from './components/layout/CustomerLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import Solutions from './pages/Solutions';
import Security from './pages/Security';
import NotFound from './pages/NotFound';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ProductCatalog from './pages/customer/ProductCatalog';
import CreateOrder from './pages/customer/CreateOrder';
import MyOrders from './pages/customer/MyOrders';
import OrderDetail from './pages/customer/OrderDetail';
import CustomerAIAssistant from './pages/customer/CustomerAIAssistant';

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
import AuditViewer from './pages/admin/AuditViewer';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
        <AuthProvider>
          <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/security" element={<Security />} />

              {/* Customer Portal Protected Routes */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<CustomerDashboard />} />
                <Route path="/products" element={<ProductCatalog />} />
                <Route path="/orders/new" element={<CreateOrder />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/assistant" element={<CustomerAIAssistant />} />
              </Route>

              {/* Admin & Inventory Manager Portal Protected Routes */}
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
                <Route path="/ai" element={<Navigate to="/admin/ai" replace />} />
                <Route path="/admin/impact" element={<ImpactAnalyzer />} />
                <Route path="/admin/simulations" element={<SimulationLab />} />
                <Route path="/admin/alerts" element={<Alerts />} />
                <Route path="/admin/replenishment" element={<Replenishment />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/audit" element={<AuditViewer />} />
              </Route>

              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </I18nProvider>
    </ThemeProvider>
  </ErrorBoundary>
  );
}

export default App;
