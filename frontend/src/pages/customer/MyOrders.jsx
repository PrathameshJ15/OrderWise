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
    <div className="space-y-6 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span>Order Dispatch &amp; Allocations</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            My Orders
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5">
            Track your demand submissions, allocation decisions, and promised delivery timelines.
          </p>
        </div>

        <Link
          to="/orders/new"
          className="btn-primary space-x-2 self-start md:self-auto shadow-[0_6px_24px_rgba(229,9,20,0.4)]"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Order</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/30 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline hover:text-t">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-base flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 border border-bd rounded-pill bg-s2 p-1 overflow-x-auto">
          {['all', 'pending', 'confirmed', 'allocated', 'partially_allocated', 'cancelled'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1 text-[12px] font-mono font-medium rounded-pill whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-ac text-white'
                    : 'text-t2 hover:text-t'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            )
          )}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 border border-bd rounded-pill bg-s2 px-4 py-2 text-sm w-full md:w-72">
          <Search className="h-4 w-4 text-t2" />
          <input
            type="text"
            placeholder="Search order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-t focus:outline-none text-[14px] w-full placeholder-t2/50 font-sans"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="card-base p-12 text-center text-t2 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-ac" />
          <span className="text-[12px] font-mono">Loading your order history...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card-base p-12 text-center text-t2 space-y-3">
          <Package className="h-8 w-8 text-t2 mx-auto opacity-50" />
          <h3 className="text-[18px] text-t font-bold">
            No Orders Found
          </h3>
          <p className="text-[14px] max-w-sm mx-auto">
            {statusFilter !== 'all'
              ? `No orders matching status filter "${statusFilter}".`
              : "You haven't submitted any customer orders yet."}
          </p>
          <div className="pt-2">
            <Link
              to="/orders/new"
              className="btn-primary"
            >
              Create New Order
            </Link>
          </div>
        </div>
      ) : (
        <div className="card-base overflow-x-auto p-0">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-bd text-t2 font-sans font-medium text-[12px] uppercase tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-3">Date Submitted</th>
                <th className="py-3 px-3">Promised Date</th>
                <th className="py-3 px-3 text-right">Items</th>
                <th className="py-3 px-3 text-right">Requested Qty</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bd/60">
              {filteredOrders.map((ord) => (
                <tr
                  key={ord.id}
                  className="hover:bg-s2/50 transition-colors group"
                >
                  <td className="py-3.5 px-4 font-bold text-t font-mono">
                    <Link to={`/orders/${ord.id}`} className="block hover:text-ac">
                      {`#${ord.id}`}
                    </Link>
                  </td>
                  <td className="py-3.5 px-3 text-t2 font-mono text-[12px]">
                    {new Date(ord.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-3 text-t2 font-mono text-[12px]">
                    {ord.promised_delivery_date || 'Standard'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-t">
                    {ord.item_count || 1}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-t">
                    {ord.total_requested_quantity || '—'}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <StatusPill status={ord.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/orders/${ord.id}`}
                      className="btn-header py-1 text-[12px] font-mono inline-flex items-center space-x-1"
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
