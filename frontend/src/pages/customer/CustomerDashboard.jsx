import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ShoppingBag,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import apiClient from '../../api/client';
import StatusPill from '../../components/ui/StatusPill';
import { useNotifications } from '../../contexts/NotificationContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { latestLiveEvent } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/orders');
      // /api/orders returns customer's own orders when authenticated as customer
      setOrders(res.data || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Acceptance Gate: when an admin runs allocation or updates status,
  // the logged-in customer's page updates without refresh
  useEffect(() => {
    if (latestLiveEvent) {
      if (
        latestLiveEvent.type === 'allocation_completed' ||
        latestLiveEvent.type === 'order_status_changed' ||
        latestLiveEvent.type === 'priority_approved'
      ) {
        fetchOrders();
      }
    }
  }, [latestLiveEvent]);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const fulfilledOrders = orders.filter((o) => o.status === 'allocated' || o.status === 'completed').length;
  const partialOrders = orders.filter((o) => o.status === 'partially_allocated').length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Welcome Banner */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <CheckCircle2 className="h-3 w-3" />
            <span>Customer Command Hub • Authenticated Portal</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Welcome, <span>{user?.name || 'Valued Customer'}</span>
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Account: {user?.email} • Authority: <span className="uppercase text-arcade-accent">{user?.role}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/orders/new"
            className="flex items-center space-x-2 px-4 py-2 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Order</span>
          </Link>
          <Link
            to="/products"
            className="flex items-center space-x-2 px-4 py-2 border border-arcade-border text-arcade-primary hover:border-arcade-accent hover:text-arcade-accent text-xs uppercase tracking-wider transition-colors"
          >
            <Package className="h-4 w-4" />
            <span>Catalog</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-arcade-danger/40 bg-arcade-danger/10 text-arcade-danger text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Real KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
            Total Placed
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-primary">
            {totalOrders}
          </div>
          <span className="text-[10px] text-arcade-secondary">Lifetime orders</span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
            Pending Queue
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-primary">
            {pendingOrders}
          </div>
          <span className="text-[10px] text-arcade-secondary">Awaiting run</span>
        </div>

        <div className="border border-arcade-accent/30 bg-arcade-accent/5 p-4">
          <div className="text-[11px] uppercase tracking-wider text-arcade-accent mb-1">
            Fulfilled
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-accent">
            {fulfilledOrders}
          </div>
          <span className="text-[10px] text-arcade-accent/80">100% stock allocated</span>
        </div>

        <div className="border border-arcade-warning/30 bg-arcade-warning/5 p-4">
          <div className="text-[11px] uppercase tracking-wider text-arcade-warning mb-1">
            Partial
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-warning">
            {partialOrders}
          </div>
          <span className="text-[10px] text-arcade-warning/80">Minimum met</span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
            Cancelled
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-secondary">
            {cancelledOrders}
          </div>
          <span className="text-[10px] text-arcade-secondary">Closed records</span>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/products"
          className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/60 transition-colors group block"
        >
          <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <Package className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg uppercase font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors flex items-center justify-between">
            <span>Product Catalog</span>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-arcade-secondary mt-1 mb-4">
            Browse active industrial inventory with real-time on-hand availability indicators.
          </p>
          <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
            Explore Catalog &rarr;
          </span>
        </Link>

        <Link
          to="/orders/new"
          className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/60 transition-colors group block"
        >
          <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <PlusCircle className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg uppercase font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors flex items-center justify-between">
            <span>Create New Order</span>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-arcade-secondary mt-1 mb-4">
            Assemble multi-line orders with custom requested quantities and minimum thresholds.
          </p>
          <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
            Draft Order &rarr;
          </span>
        </Link>

        <Link
          to="/orders"
          className="border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/60 transition-colors group block"
        >
          <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center mb-3">
            <Clock className="h-4 w-4" />
          </div>
          <h3 className="font-display text-lg uppercase font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors flex items-center justify-between">
            <span>My Orders &amp; Allocations</span>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-arcade-secondary mt-1 mb-4">
            Track allocation explanations, item status, and scheduled promised delivery dates.
          </p>
          <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
            View All ({totalOrders}) &rarr;
          </span>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-arcade-border pb-3">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4 text-arcade-accent" />
            <h3 className="font-display text-base uppercase font-bold text-arcade-primary">
              Recent Order History
            </h3>
          </div>
          <Link
            to="/orders"
            className="text-xs text-arcade-accent hover:underline uppercase tracking-wider"
          >
            View All Orders &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-arcade-secondary flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-arcade-accent" />
            <span className="text-xs">Loading order telemetry...</span>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-arcade-secondary space-y-2">
            <AlertCircle className="h-6 w-6 text-arcade-secondary mx-auto opacity-60" />
            <div className="text-sm font-bold text-arcade-primary uppercase">No Orders Placed Yet</div>
            <p className="text-xs max-w-sm mx-auto">
              You haven&apos;t placed any orders yet. Browse our catalog and submit your first order.
            </p>
            <div className="pt-2">
              <Link
                to="/orders/new"
                className="inline-block px-3 py-1.5 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase"
              >
                Create First Order
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arcade-border text-arcade-secondary uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Date Placed</th>
                  <th className="py-2.5 px-3">Promised Delivery</th>
                  <th className="py-2.5 px-3 text-right">Items</th>
                  <th className="py-2.5 px-3 text-right">Requested Qty</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arcade-border/40">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-arcade-surface/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-arcade-primary">#{ord.id}</td>
                    <td className="py-3 px-3 text-arcade-secondary">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-arcade-secondary">
                      {ord.promised_delivery_date || 'Standard Delivery'}
                    </td>
                    <td className="py-3 px-3 text-right text-arcade-primary">
                      {ord.item_count || 1}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-arcade-primary">
                      {ord.total_requested_quantity || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusPill status={ord.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="px-2.5 py-1 border border-arcade-border text-arcade-primary hover:border-arcade-accent hover:text-arcade-accent text-[11px] uppercase tracking-wider transition-colors inline-block"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
