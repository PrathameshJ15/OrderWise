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
  ClipboardList,
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
    <div className="space-y-6 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Customer Command Hub • Authenticated Portal</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            Welcome, <span>{user?.name || 'Valued Customer'}</span>
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5">
            Account: {user?.email} • Authority: <span className="font-mono text-ac font-medium">{user?.role}</span>
          </p>
        </div>

        {/* Buttons: pill (999px), min-height 44px */}
        <div className="flex items-center space-x-3">
          <Link
            to="/orders/new"
            className="btn-primary space-x-2 shadow-[0_6px_24px_rgba(229,9,20,0.4)]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Order</span>
          </Link>
          <Link
            to="/products"
            className="btn-secondary space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>Product Catalog</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/30 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline hover:text-t">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Row: Small label, 34px value, mono caption */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card-base p-5 flex flex-col justify-between">
          <span className="text-[12px] font-mono text-t2">Total Placed</span>
          <div className="text-[34px] font-display font-bold text-t tracking-tight my-1">
            {totalOrders}
          </div>
          <span className="text-[11px] font-mono text-t2">Lifetime orders</span>
        </div>

        <div className="card-base p-5 flex flex-col justify-between">
          <span className="text-[12px] font-mono text-t2">Pending Queue</span>
          <div className="text-[34px] font-display font-bold text-t tracking-tight my-1">
            {pendingOrders}
          </div>
          <span className="text-[11px] font-mono text-t2">Awaiting run</span>
        </div>

        <div className="card-base p-5 flex flex-col justify-between">
          <span className="text-[12px] font-mono text-ok font-medium">Fulfilled</span>
          <div className="text-[34px] font-display font-bold text-ok tracking-tight my-1">
            {fulfilledOrders}
          </div>
          <span className="text-[11px] font-mono text-ok/80">100% stock allocated</span>
        </div>

        <div className="card-base p-5 flex flex-col justify-between">
          <span className="text-[12px] font-mono text-wa font-medium">Partial</span>
          <div className="text-[34px] font-display font-bold text-wa tracking-tight my-1">
            {partialOrders}
          </div>
          <span className="text-[11px] font-mono text-wa/80">Minimum met</span>
        </div>

        <div className="card-base p-5 flex flex-col justify-between">
          <span className="text-[12px] font-mono text-t2">Cancelled</span>
          <div className="text-[34px] font-display font-bold text-t2 tracking-tight my-1">
            {cancelledOrders}
          </div>
          <span className="text-[11px] font-mono text-t2">Closed records</span>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/products"
          className="card-base hover:border-white transition-colors group block space-y-3"
        >
          <div className="w-9 h-9 rounded-full bg-s2 text-t flex items-center justify-center">
            <Package className="h-4 w-4" />
          </div>
          <h3 className="text-[18px] font-bold text-t group-hover:text-ac transition-colors flex items-center justify-between">
            <span>Product Catalog</span>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-[14px] text-t2 leading-normal">
            Browse active industrial inventory with real-time on-hand availability indicators.
          </p>
          <span className="text-[12px] font-mono text-t font-medium inline-block pt-1">
            Explore catalog &rarr;
          </span>
        </Link>

        <Link
          to="/orders/new"
          className="card-base hover:border-white transition-colors group block space-y-3"
        >
          <div className="w-9 h-9 rounded-full bg-s2 text-t flex items-center justify-center">
            <PlusCircle className="h-4 w-4" />
          </div>
          <h3 className="text-[18px] font-bold text-t group-hover:text-ac transition-colors flex items-center justify-between">
            <span>Create New Order</span>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-[14px] text-t2 leading-normal">
            Assemble multi-line orders with custom requested quantities and minimum thresholds.
          </p>
          <span className="text-[12px] font-mono text-t font-medium inline-block pt-1">
            Draft order &rarr;
          </span>
        </Link>

        <Link
          to="/orders"
          className="card-base hover:border-white transition-colors group block space-y-3"
        >
          <div className="w-9 h-9 rounded-full bg-s2 text-t flex items-center justify-center">
            <ClipboardList className="h-4 w-4" />
          </div>
          <h3 className="text-[18px] font-bold text-t group-hover:text-ac transition-colors flex items-center justify-between">
            <span>My Orders</span>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-[14px] text-t2 leading-normal">
            Track real-time allocation outcomes, delivery dates, and item-by-item status reports.
          </p>
          <span className="text-[12px] font-mono text-t font-medium inline-block pt-1">
            View orders &rarr;
          </span>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="card-base space-y-4">
        <div className="flex items-center justify-between border-b border-bd pb-4">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4 text-ac" />
            <h2 className="text-[20px] font-bold text-t">Recent orders</h2>
          </div>
          <Link
            to="/orders"
            className="text-[12px] font-mono text-t2 hover:text-t transition-colors"
          >
            View all ({orders.length}) &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-t2 space-y-2">
            <RefreshCw className="h-5 w-5 animate-spin text-ac" />
            <span className="text-[12px] font-mono">Loading your orders...</span>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center text-t2 space-y-3">
            <p className="text-[14px]">You have not placed any orders yet.</p>
            <Link
              to="/orders/new"
              className="btn-primary"
            >
              Place Your First Order
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-s2 rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-bd transition-colors border border-transparent"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-t text-[15px]">Order <span>#{order.id}</span></span>
                    <StatusPill status={order.status} size="sm" />
                    {order.priority && (
                      <StatusPill status={order.priority} type="priority" size="sm" />
                    )}
                  </div>
                  <div className="text-[12px] font-mono text-t2">
                    Placed {new Date(order.created_at).toLocaleDateString()} • {order.items_count || order.item_count || '1'} items
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <Link
                    to={`/orders/${order.id}`}
                    className="btn-header py-1.5 text-[12px] font-mono"
                  >
                    View details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
