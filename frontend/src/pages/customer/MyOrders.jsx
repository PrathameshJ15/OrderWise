import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Search,
  PlusCircle,
  RefreshCw,
  ChevronRight,
  Package,
} from 'lucide-react';
import apiClient from '../../api/client';
import StatusPill from '../../components/ui/StatusPill';
import { useNotifications } from '../../contexts/NotificationContext';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { latestLiveEvent } = useNotifications();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/orders');
      setOrders(res.data || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to fetch your orders.');
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

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(o.id).includes(q) ||
      (o.business_notes && o.business_notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <Clock className="h-3 w-3" />
            <span>ORDER DISPATCH &amp; ALLOCATIONS</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            My Orders
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Track your demand submissions, allocation decisions, and promised delivery timelines.
          </p>
        </div>

        <Link
          to="/orders/new"
          className="flex items-center space-x-2 px-4 py-2.5 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity self-start md:self-auto shadow-[0_0_12px_rgba(200,255,58,0.25)]"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Order</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 border border-arcade-danger/40 bg-arcade-danger/10 text-arcade-danger text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="border border-arcade-border bg-arcade-neutral p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 border border-arcade-border bg-arcade-surface p-1 overflow-x-auto">
          {['all', 'pending', 'confirmed', 'allocated', 'partially_allocated', 'cancelled'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs uppercase tracking-wider whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                    : 'text-arcade-secondary hover:text-arcade-primary'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            )
          )}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 border border-arcade-border bg-arcade-surface px-3 py-1.5 text-xs w-full md:w-64">
          <Search className="h-3.5 w-3.5 text-arcade-secondary" />
          <input
            type="text"
            placeholder="Search order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-arcade-primary focus:outline-none text-xs w-full placeholder-arcade-secondary/60"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-arcade-accent" />
          <span className="text-xs uppercase tracking-wider">Loading your order history...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary space-y-3">
          <Package className="h-8 w-8 text-arcade-secondary mx-auto opacity-50" />
          <h3 className="font-display text-base uppercase text-arcade-primary font-bold">
            No Orders Found
          </h3>
          <p className="text-xs max-w-sm mx-auto">
            {statusFilter !== 'all'
              ? `No orders matching status filter "${statusFilter}".`
              : "You haven't submitted any customer orders yet."}
          </p>
          <div className="pt-2">
            <Link
              to="/orders/new"
              className="inline-block px-4 py-2 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase"
            >
              Create New Order
            </Link>
          </div>
        </div>
      ) : (
        <div className="border border-arcade-border bg-arcade-neutral overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arcade-border bg-arcade-surface/60 text-arcade-secondary uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-3">Date Submitted</th>
                <th className="py-3 px-3">Promised Date</th>
                <th className="py-3 px-3 text-right">Items</th>
                <th className="py-3 px-3 text-right">Requested Qty</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arcade-border/50">
              {filteredOrders.map((ord) => (
                <tr
                  key={ord.id}
                  className="hover:bg-arcade-surface/50 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-bold text-arcade-primary group-hover:text-arcade-accent">
                    <Link to={`/orders/${ord.id}`} className="block">
                      {`#${ord.id}`}
                    </Link>
                  </td>
                  <td className="py-3.5 px-3 text-arcade-secondary">
                    {new Date(ord.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-3 text-arcade-secondary">
                    {ord.promised_delivery_date || 'Standard'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-arcade-primary">
                    {ord.item_count || 1}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-arcade-primary">
                    {ord.total_requested_quantity || '—'}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <StatusPill status={ord.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/orders/${ord.id}`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 border border-arcade-border text-arcade-primary hover:border-arcade-accent hover:text-arcade-accent text-[11px] uppercase tracking-wider transition-colors"
                    >
                      <span>View</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
