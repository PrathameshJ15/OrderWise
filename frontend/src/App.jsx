import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import PlaceholderLayout from './components/layout/PlaceholderLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRoute from './components/layout/RoleRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Portal Pages (Phase 6)
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ProductCatalog from './pages/customer/ProductCatalog';
import CreateOrder from './pages/customer/CreateOrder';
import MyOrders from './pages/customer/MyOrders';
import OrderDetail from './pages/customer/OrderDetail';

// Admin Operations Pages (Phase 7 & Supply Intelligence & AI)
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import OrderManagement from './pages/admin/OrderManagement';
import AllocationCenter from './pages/admin/AllocationCenter';
import AIRecommendations from './pages/admin/AIRecommendations';
import SimulationLab from './pages/admin/SimulationLab';
import Alerts from './pages/admin/Alerts';
import Replenishment from './pages/admin/Replenishment';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PlaceholderLayout />}>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer authenticated routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<CustomerDashboard />} />
                <Route path="/products" element={<ProductCatalog />} />
                <Route path="/orders/new" element={<CreateOrder />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
              </Route>

              {/* Admin authenticated & role-gated routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<RoleRoute allowedRoles={['admin', 'inventory_manager']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<ProductManagement />} />
                  <Route path="/admin/inventory" element={<InventoryManagement />} />
                  <Route path="/admin/orders" element={<OrderManagement />} />
                  <Route path="/admin/allocation" element={<AllocationCenter />} />
                  <Route path="/admin/ai" element={<AIRecommendations />} />
                  <Route path="/ai" element={<Navigate to="/admin/ai" replace />} />
                  <Route path="/admin/simulations" element={<SimulationLab />} />
                  <Route path="/admin/alerts" element={<Alerts />} />
                  <Route path="/admin/replenishment" element={<Replenishment />} />
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
