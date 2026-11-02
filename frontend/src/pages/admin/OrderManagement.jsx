import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  XCircle,
  AlertCircle,
  Eye,
  Cpu,
  Sparkles,
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
    <div className="space-y-6 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Central Order Operations</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            Order Management
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5">
            Review demand queue, customer delivery commitments, and assigned priority rankings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/ai"
            className="btn-secondary min-h-[44px] px-4 text-[14px] flex items-center space-x-1.5"
          >
            <Sparkles className="h-4 w-4 text-ac" />
            <span>AI Priorities</span>
          </Link>
          <Link
            to="/admin/allocation"
            className="btn-primary flex items-center space-x-1.5 shadow-[0_6px_24px_rgba(229,9,20,0.4)]"
          >
            <Cpu className="h-4 w-4" />
            <span>Allocate Stock &rarr;</span>
          </Link>
          <div className="flex items-center space-x-2 rounded-pill bg-s2 border border-bd px-4 py-2 text-[14px] w-full md:w-60">
            <Search className="h-4 w-4 text-t2 shrink-0" />
            <input
              type="text"
              placeholder="Search order ID or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-t focus:outline-none text-[14px] w-full placeholder-t2/60"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/40 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline hover:text-t text-[12px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div role="tablist" className="card-base p-3 flex items-center space-x-2 overflow-x-auto">
        <Filter className="h-4 w-4 text-t2 shrink-0 mr-2 ml-1" />
        {['all', 'pending', 'confirmed', 'allocated', 'partially_allocated', 'cancelled'].map((st) => (
          <div
            key={st}
            role="tab"
            tabIndex={0}
            aria-selected={statusFilter === st}
            onClick={() => setStatusFilter(st)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter(st); }}
            className={`cursor-pointer px-4 py-1.5 rounded-pill text-[12px] font-mono uppercase tracking-wider whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-ac text-white font-bold'
                : 'bg-s2 text-t2 hover:text-t border border-bd'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="card-base p-12 text-center text-t2 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-ac" />
          <span className="text-[12px] font-mono tracking-wider">Loading orders directory...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card-base p-12 text-center text-t2 space-y-2">
          <ShoppingBag className="h-8 w-8 text-t2 mx-auto opacity-40" />
          <h3 className="text-base font-bold text-t">
            No Orders Match Filter
          </h3>
          <p className="text-[14px]">Try selecting a different status filter.</p>
        </div>
      ) : (
        <div className="card-base p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead>
                <tr className="border-b border-bd bg-s2/60 text-t2 text-[12px] font-sans font-medium uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-3">Customer</th>
                  <th className="py-3.5 px-3">Promised Date</th>
                  <th className="py-3.5 px-3 text-center">Approved Priority</th>
                  <th className="py-3.5 px-3 text-right">Items</th>
                  <th className="py-3.5 px-3 text-right">Requested Qty</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bd/50">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-s2/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-t">{`#${ord.id}`}</td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-t">{ord.customer_name}</div>
                      <div className="text-[12px] font-mono text-t2">{ord.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-3 text-t2 text-[13px]">
                      {ord.promised_delivery_date || 'Standard'}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge priority={ord.approved_priority || ord.priority_level || ord.priority || 'MEDIUM'} />
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-t">
                      {ord.item_count || 1}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-t">
                      {ord.total_requested_quantity || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <StatusPill status={ord.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => viewOrderDetails(ord.id)}
                        className="p-2 rounded-full border border-bd text-t2 hover:text-t hover:border-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {ord.status === 'pending' && (
                        <button
                          onClick={() => handleConfirmOrder(ord.id)}
                          className="btn-header inline-flex items-center px-3 py-1.5 text-[12px] font-bold text-ok border-ok/40 hover:bg-ok/10"
                          title="Confirm Order"
                        >
                          Confirm
                        </button>
                      )}
                      {ord.status !== 'cancelled' && ord.status !== 'completed' && (
                        <button
                          onClick={() => openCancelModal(ord.id)}
                          className="p-2 rounded-full border border-bd text-no/70 hover:text-no hover:border-no transition-colors"
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
        </div>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Order Inspection: #${selectedOrder?.id}`}
      >
        <div className="space-y-4 text-[14px]">
          {loadingDetail ? (
            <div className="p-8 text-center text-t2 flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-ac" />
              <span className="font-mono text-[12px]">Fetching order items and allocations...</span>
            </div>
          ) : selectedOrder ? (
            <>
              <div className="p-4 bg-s2 rounded-card border border-bd grid grid-cols-2 gap-3 text-[14px]">
                <div>
                  <span className="text-[11px] font-mono text-t2 block">Customer</span>
                  <span className="font-bold text-t">{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-t2 block">Status</span>
                  <StatusPill status={selectedOrder.status} />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-t2 block">Promised Date</span>
                  <span className="text-t">{selectedOrder.promised_delivery_date || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-t2 block">Created At</span>
                  <span className="text-t2 text-[13px]">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
              </div>

              {selectedOrder.business_notes && (
                <div className="p-3.5 bg-s2 rounded-card border border-bd">
                  <span className="text-[11px] font-mono text-t2 block mb-1">Business Notes</span>
                  <p className="text-t italic">&ldquo;{selectedOrder.business_notes}&rdquo;</p>
                </div>
              )}

              <div className="space-y-2.5">
                <span className="text-[12px] font-mono text-t2 block">
                  Line Items &amp; Allocation Explanations
                </span>
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {selectedOrder.items?.map((itm) => (
                    <div key={itm.id} className="p-3.5 bg-s2 rounded-card border border-bd space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-t">
                          {itm.product_name} <span className="text-t2 font-mono text-[12px]">({itm.sku})</span>
                        </span>
                        <StatusPill status={itm.allocation_status} />
                      </div>
                      <div className="text-[13px] text-t2 font-mono">
                        Requested: <span className="font-bold text-t">{itm.requested_quantity}</span> • Min:{' '}
                        {itm.minimum_acceptable_quantity} • Allocated:{' '}
                        <span className="font-bold text-ok">{itm.allocated_quantity ?? '—'}</span>
                      </div>
                      {itm.allocation_explanation && (
                        <p className="text-[12px] text-t2 pt-2 border-t border-bd/40">
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
        <div className="space-y-4 text-[14px]">
          <p className="text-t2">
            Are you sure you want to cancel this customer order? All allocated quantities will be released back to free warehouse stock.
          </p>
          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Cancellation Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Stock shortage, customer request"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t focus:border-ac focus:outline-none text-[14px]"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-bd">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="btn-header px-5 py-2 text-[14px]"
            >
              Keep Order
            </button>
            <button
              onClick={handleCancelOrder}
              className="btn-primary bg-no border-no text-white hover:bg-no/90 px-6 py-2 text-[14px]"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
