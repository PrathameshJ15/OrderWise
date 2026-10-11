import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import StatusPill from '../../components/ui/StatusPill';
import Skeleton, { TableRowSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Toast from '../../components/ui/Toast';
import {
  ClipboardList,
  Search,
  Filter,
  PlusCircle,
  ArrowRight,
  Calendar,
  Layers,
} from 'lucide-react';

export function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setLoading(true);
      try {
        const res = await apiClient.get('/orders/my');
        const list = res.orders || res.data?.orders || res;
        if (isMounted) {
          setOrders(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load orders:', err);
          setErrorMessage(err.error?.message || err.message || 'Failed to load orders');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const filterTabs = [
    { key: 'ALL', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'fulfilled', label: 'Fulfilled' },
    { key: 'partially_fulfilled', label: 'Partially Fulfilled' },
    { key: 'deferred', label: 'Deferred' },
  ];

  const filteredOrders = orders.filter((ord) => {
    const statusMatch =
      statusFilter === 'ALL' ||
      (ord.display_status || ord.status).toLowerCase() === statusFilter.toLowerCase();

    const query = searchQuery.trim().toLowerCase();
    const queryMatch =
      !query ||
      String(ord.id).includes(query) ||
      (ord.business_notes && ord.business_notes.toLowerCase().includes(query)) ||
      (ord.items && ord.items.some((it) => it.product_name?.toLowerCase().includes(query) || it.product_sku?.toLowerCase().includes(query)));

    return statusMatch && queryMatch;
  });

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Equipment Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track allocation decisions, line items fulfillment, and delivery promises in real time.
          </p>
        </div>

        <Link
          to="/orders/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Order</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0" role="tablist">
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, product..."
            className="block w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white shadow-xs focus:ring-indigo-500 focus:border-indigo-500 transition"
            aria-label="Filter orders"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No orders found"
              description={
                orders.length === 0
                  ? 'You have not placed any orders yet. Click below to start your first order.'
                  : 'No orders match your selected filters. Try choosing a different status filter or clearing your search.'
              }
              actionText={orders.length === 0 ? 'Create Order Now' : 'Clear Filters'}
              onAction={
                orders.length === 0
                  ? () => (window.location.href = '/orders/new')
                  : () => {
                      setStatusFilter('ALL');
                      setSearchQuery('');
                    }
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600" aria-label="Customer orders list">
              <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Order</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Date Placed</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Promised Delivery</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Priority</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Requested vs Allocated</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-3.5 font-semibold text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => {
                  const statusKey = ord.display_status || ord.status;
                  const totalReq = ord.total_requested ?? ord.items?.reduce((s, it) => s + it.requested_quantity, 0) ?? 0;
                  const totalAlloc = ord.total_allocated ?? ord.items?.reduce((s, it) => s + (it.latest_allocation?.allocated_quantity || 0), 0) ?? 0;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <Link to={`/orders/${ord.id}`} className="hover:text-indigo-600">
                          Order #{ord.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {ord.promised_delivery_date
                          ? new Date(ord.promised_delivery_date).toLocaleDateString()
                          : 'Flexible'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={ord.priority || 'MEDIUM'} type="priority" size="sm" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {totalAlloc} / {totalReq} units
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ord.total_items || ord.items?.length || 1} line item(s)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={statusKey} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
