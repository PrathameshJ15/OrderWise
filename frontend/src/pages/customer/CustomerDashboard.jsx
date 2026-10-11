import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import StatusPill from '../../components/ui/StatusPill';
import Skeleton, { TableRowSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Toast from '../../components/ui/Toast';
import {
  PackagePlus,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

export function CustomerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    fulfilled: 0,
    partially_fulfilled: 0,
    deferred: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          apiClient.get('/orders/stats/my'),
          apiClient.get('/orders/my?limit=5'),
        ]);

        if (isMounted) {
          const statsData = statsRes.stats || statsRes.data || statsRes;
          const ordersData = ordersRes.orders || ordersRes.data?.orders || ordersRes;

          setStats({
            total: statsData.total || 0,
            pending: statsData.pending || 0,
            fulfilled: statsData.fulfilled || 0,
            partially_fulfilled: statsData.partially_fulfilled || 0,
            deferred: statsData.deferred || 0,
          });

          setRecentOrders(Array.isArray(ordersData) ? ordersData : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load dashboard:', err);
          setErrorMessage(err.error?.message || err.message || 'Failed to load dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.total,
      icon: ClipboardList,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      badge: 'All Placed',
    },
    {
      title: 'Pending Allocation',
      value: stats.pending,
      icon: Clock3,
      color: 'bg-slate-50 text-slate-700 border-slate-200',
      badge: 'In Queue',
    },
    {
      title: 'Fulfilled',
      value: stats.fulfilled,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      badge: '100% Stock',
    },
    {
      title: 'Partially Fulfilled',
      value: stats.partially_fulfilled,
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      badge: 'Min Threshold Met',
    },
    {
      title: 'Deferred',
      value: stats.deferred,
      icon: AlertCircle,
      color: 'bg-rose-50 text-rose-700 border-rose-100',
      badge: 'Stock Constrained',
    },
  ];

  return (
    <div className="space-y-8">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage('')} />
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Customer'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your equipment order allocations, delivery timelines, and inventory availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Create New Order</span>
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
          >
            <span>Product Catalog</span>
          </Link>
        </div>
      </div>

      {/* Real Counts Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border bg-white shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4">
                {loading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  <div className="text-3xl font-extrabold text-slate-900">{card.value}</div>
                )}
                <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
                  {card.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status and item allocations for your latest orders
            </p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No orders placed yet"
              description="You have not created any purchase orders. Browse the catalog and place an order to test our deterministic allocation engine."
              actionText="Create Order Now"
              onAction={() => (window.location.href = '/orders/new')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600" aria-label="Recent customer orders">
              <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Order ID</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Date Placed</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Promised Delivery</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Items</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Allocation Status</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <Link to={`/orders/${order.id}`} className="hover:text-indigo-600">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {order.promised_delivery_date
                        ? new Date(order.promised_delivery_date).toLocaleDateString()
                        : 'Flexible'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                        {order.total_items || order.items?.length || 1} line item(s)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={order.display_status || order.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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

export default CustomerDashboard;
