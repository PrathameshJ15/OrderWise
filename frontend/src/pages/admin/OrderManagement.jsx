import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import apiClient from '../../api/client';
import StatusPill from '../../components/ui/StatusPill';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Cancel order state
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await apiClient.get('/orders', { params });
      setOrders(res.data || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to fetch customer orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const viewOrderDetails = async (orderId) => {
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (_err) {
      setError('Failed to fetch detailed order items.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await apiClient.patch(`/orders/${orderId}/confirm`);
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: 'confirmed' }));
      }
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to confirm order.');
    }
  };

  const openCancelModal = (orderId) => {
    setCancellingId(orderId);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleCancelOrder = async () => {
    if (!cancellingId) return;
    try {
      await apiClient.patch(`/orders/${cancellingId}/cancel`, {
        reason: cancelReason.trim() || 'Cancelled by administrator',
      });
      setCancelModalOpen(false);
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === cancellingId) {
        setSelectedOrder((prev) => ({ ...prev, status: 'cancelled' }));
      }
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to cancel order.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(o.id).includes(q) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <ShoppingBag className="h-3 w-3" />
            <span>CENTRAL ORDER OPERATIONS</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Order Management
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Review demand queue, customer delivery commitments, and assigned priority rankings.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 border border-arcade-border bg-arcade-surface px-3 py-2 text-xs w-full md:w-72">
          <Search className="h-3.5 w-3.5 text-arcade-secondary" />
          <input
            type="text"
            placeholder="Search order ID or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-arcade-primary focus:outline-none text-xs w-full placeholder-arcade-secondary/60"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 border border-arcade-danger/40 bg-arcade-danger/10 text-arcade-danger text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline hover:text-white text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div role="tablist" className="border border-arcade-border bg-arcade-neutral p-4 flex items-center space-x-1 overflow-x-auto">
        <Filter className="h-3.5 w-3.5 text-arcade-secondary shrink-0 mr-2" />
        {['all', 'pending', 'confirmed', 'allocated', 'partially_allocated', 'cancelled'].map((st) => (
          <div
            key={st}
            role="tab"
            tabIndex={0}
            aria-selected={statusFilter === st}
            onClick={() => setStatusFilter(st)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter(st); }}
            className={`cursor-pointer px-3 py-1 text-xs uppercase tracking-wider whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-arcade-surface text-arcade-accent font-bold border border-arcade-border'
                : 'text-arcade-secondary hover:text-arcade-primary'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-arcade-accent" />
          <span className="text-xs uppercase tracking-wider">Loading orders directory...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary space-y-2">
          <ShoppingBag className="h-8 w-8 text-arcade-secondary mx-auto opacity-50" />
          <h3 className="font-display text-base uppercase text-arcade-primary font-bold">
            No Orders Match Filter
          </h3>
          <p className="text-xs">Try selecting a different status filter.</p>
        </div>
      ) : (
        <div className="border border-arcade-border bg-arcade-neutral overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arcade-border bg-arcade-surface/60 text-arcade-secondary uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Promised Date</th>
                <th className="py-3 px-3 text-center">Approved Priority</th>
                <th className="py-3 px-3 text-right">Items</th>
                <th className="py-3 px-3 text-right">Requested Qty</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arcade-border/50">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-arcade-surface/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-arcade-primary">{`#${ord.id}`}</td>
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-arcade-primary">{ord.customer_name}</div>
                    <div className="text-[10px] text-arcade-secondary">{ord.customer_email}</div>
                  </td>
                  <td className="py-3.5 px-3 text-arcade-secondary">
                    {ord.promised_delivery_date || 'Standard'}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Badge priority={ord.approved_priority || ord.priority_level || ord.priority || 'MEDIUM'} />
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
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => viewOrderDetails(ord.id)}
                      className="p-1 border border-arcade-border text-arcade-secondary hover:text-arcade-accent hover:border-arcade-accent transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {ord.status === 'pending' && (
                      <button
                        onClick={() => handleConfirmOrder(ord.id)}
                        className="px-2 py-0.5 border border-arcade-accent/40 bg-arcade-accent/10 text-arcade-accent text-[10px] uppercase font-bold hover:bg-arcade-accent hover:text-arcade-surface transition-colors"
                        title="Confirm Order"
                      >
                        Confirm
                      </button>
                    )}
                    {ord.status !== 'cancelled' && ord.status !== 'completed' && (
                      <button
                        onClick={() => openCancelModal(ord.id)}
                        className="p-1 border border-arcade-border text-arcade-secondary hover:text-arcade-danger hover:border-arcade-danger transition-colors"
                        title="Cancel Order"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Order Inspection: #${selectedOrder?.id}`}
      >
        <div className="space-y-4 text-xs font-mono">
          {loadingDetail ? (
            <div className="p-8 text-center text-arcade-secondary flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-arcade-accent" />
              <span>Fetching order items and allocations...</span>
            </div>
          ) : selectedOrder ? (
            <>
              <div className="p-3 bg-arcade-surface border border-arcade-border grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-arcade-secondary block">Customer</span>
                  <span className="font-bold text-arcade-primary">{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-arcade-secondary block">Status</span>
                  <StatusPill status={selectedOrder.status} />
                </div>
                <div>
                  <span className="text-[10px] uppercase text-arcade-secondary block">Promised Date</span>
                  <span className="text-arcade-primary">{selectedOrder.promised_delivery_date || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-arcade-secondary block">Created At</span>
                  <span className="text-arcade-secondary">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
              </div>

              {selectedOrder.business_notes && (
                <div className="p-2.5 bg-arcade-surface border border-arcade-border text-xs">
                  <span className="text-[10px] uppercase text-arcade-secondary block mb-0.5">Business Notes</span>
                  <p className="text-arcade-primary italic">&ldquo;{selectedOrder.business_notes}&rdquo;</p>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-arcade-secondary block">
                  Line Items &amp; Allocation Explanations
                </span>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedOrder.items?.map((itm) => (
                    <div key={itm.id} className="p-3 bg-arcade-surface border border-arcade-border space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-arcade-primary">
                          {itm.product_name} ({itm.sku})
                        </span>
                        <StatusPill status={itm.allocation_status} />
                      </div>
                      <div className="text-[11px] text-arcade-secondary">
                        Requested: <span className="font-bold text-arcade-primary">{itm.requested_quantity}</span> • Min:{' '}
                        {itm.minimum_acceptable_quantity} • Allocated:{' '}
                        <span className="font-bold text-arcade-accent">{itm.allocated_quantity ?? '—'}</span>
                      </div>
                      {itm.allocation_explanation && (
                        <p className="text-[10px] text-arcade-secondary pt-1 border-t border-arcade-border/40">
                          {itm.allocation_explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`Cancel Order #${cancellingId}`}
      >
        <div className="space-y-4 text-xs font-mono">
          <p className="text-arcade-secondary">
            Are you sure you want to cancel this customer order? All allocated quantities will be released back to free warehouse stock.
          </p>
          <div>
            <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
              Cancellation Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Stock shortage, customer request"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="px-3 py-1.5 border border-arcade-border text-arcade-secondary uppercase text-xs"
            >
              Keep Order
            </button>
            <button
              onClick={handleCancelOrder}
              className="px-4 py-1.5 bg-arcade-danger text-white uppercase text-xs font-bold hover:opacity-90"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
