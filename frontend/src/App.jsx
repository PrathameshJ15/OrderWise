/**
 * App.jsx — Root router with React.lazy code splitting.
 *
 * Every page-level component is lazy-loaded so Vite emits a separate chunk
 * per route.  The Suspense boundary shows a minimal spinner while the chunk
 * loads (typically < 100 ms on a warm cache).
 *
 * Chunk strategy (configured in vite.config.js):
 *   vendor       — react, react-dom, react-router-dom
 *   charts       — recharts
 *   icons        — lucide-react
 *   admin        — all /admin/* pages
 *   customer     — all /dashboard, /products, /orders/* pages
 *   auth         — login, register
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ProtectedRoute from './components/layout/ProtectedRoute';
import CustomerLayout from './components/layout/CustomerLayout';
import AdminLayout from './components/layout/AdminLayout';

// ── Auth Pages (small, load eagerly for fast first paint) ────────────────────
import Login from './pages/Login';
import Register from './pages/Register';

// ── Customer Pages ───────────────────────────────────────────────────────────
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const ProductCatalog    = lazy(() => import('./pages/customer/ProductCatalog'));
const CreateOrder       = lazy(() => import('./pages/customer/CreateOrder'));
const MyOrders          = lazy(() => import('./pages/customer/MyOrders'));
const OrderDetail       = lazy(() => import('./pages/customer/OrderDetail'));

// ── Admin Pages ──────────────────────────────────────────────────────────────
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'));
const ProductManagement   = lazy(() => import('./pages/admin/ProductManagement'));
const InventoryManagement = lazy(() => import('./pages/admin/InventoryManagement'));
const OrderManagement     = lazy(() => import('./pages/admin/OrderManagement'));
const AllocationCenter    = lazy(() => import('./pages/admin/AllocationCenter'));
const AIRecommendations   = lazy(() => import('./pages/admin/AIRecommendations'));
const ImpactAnalyzer      = lazy(() => import('./pages/admin/ImpactAnalyzer'));
const SimulationLab       = lazy(() => import('./pages/admin/SimulationLab'));
const Alerts              = lazy(() => import('./pages/admin/Alerts'));
const Replenishment       = lazy(() => import('./pages/admin/Replenishment'));
const Reports             = lazy(() => import('./pages/admin/Reports'));

/** Full-page loading spinner shown while a lazy chunk is fetching. */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Loading…</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer Portal Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <CustomerLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard"  element={<CustomerDashboard />} />
                <Route path="/products"   element={<ProductCatalog />} />
                <Route path="/orders/new" element={<CreateOrder />} />
                <Route path="/orders"     element={<MyOrders />} />
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
                <Route path="/admin"                element={<AdminDashboard />} />
                <Route path="/admin/products"       element={<ProductManagement />} />
                <Route path="/admin/inventory"      element={<InventoryManagement />} />
                <Route path="/admin/orders"         element={<OrderManagement />} />
                <Route path="/admin/allocation"     element={<AllocationCenter />} />
                <Route path="/admin/ai"             element={<AIRecommendations />} />
                <Route path="/admin/impact"         element={<ImpactAnalyzer />} />
                <Route path="/admin/simulations"    element={<SimulationLab />} />
                <Route path="/admin/alerts"         element={<Alerts />} />
                <Route path="/admin/replenishment"  element={<Replenishment />} />
                <Route path="/admin/reports"        element={<Reports />} />
              </Route>

              {/* Default Redirection */}
              <Route path="/"  element={<Navigate to="/login" replace />} />
              <Route path="*"  element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
