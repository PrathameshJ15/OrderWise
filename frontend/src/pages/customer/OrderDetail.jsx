import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  FileText,
  Info,
  Layers,
} from 'lucide-react';
import apiClient from '../../api/client';
import StatusPill from '../../components/ui/StatusPill';
import Modal from '../../components/ui/Modal';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState(null);

  const fetchOrderDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to retrieve order details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    setError(null);
    try {
      const res = await apiClient.patch(`/orders/${id}/cancel`, {
        reason: cancelReason.trim() || 'Cancelled by customer',
      });
      setOrder(res.data);
      setCancelModalOpen(false);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="card-base p-12 text-center text-t2 flex flex-col items-center justify-center space-y-3 font-sans my-8">
        <RefreshCw className="h-6 w-6 animate-spin text-ac" />
        <span className="text-[12px] font-mono">Loading order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card-base p-12 text-center text-t2 space-y-3 font-sans my-8">
        <AlertTriangle className="h-8 w-8 text-wa mx-auto" />
        <h2 className="text-[20px] font-bold text-t">
          Order #{id} Not Found
        </h2>
        <p className="text-[14px]">
          This order does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/orders"
          className="btn-primary"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const isPending = order.status === 'pending';
  const isConfirmed = order.status === 'confirmed';
  const isAllocated =
    order.status === 'allocated' ||
    order.status === 'partially_allocated' ||
    order.items?.some((i) => i.allocation_status !== null);
  const isShipped = order.status === 'shipped' || order.status === 'completed';

  const timelineSteps = [
    {
      title: 'Submitted',
      desc: 'Order created in queue',
      completed: true,
      current: isPending,
    },
    {
      title: 'Confirmed',
      desc: 'Approved by dispatch',
      completed: isConfirmed || isAllocated || isShipped,
      current: isConfirmed,
    },
    {
      title: 'Allocated',
      desc: 'Stock evaluated by engine',
      completed: isAllocated || isShipped,
      current: isAllocated && !isShipped,
    },
    {
      title: 'Shipped',
      desc: 'Dispatched for delivery',
      completed: isShipped,
      current: isShipped,
    },
  ];

  return (
    <div className="space-y-6 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-2 text-[12px] font-sans text-t2 mb-1.5">
            <Link to="/orders" className="hover:text-t flex items-center space-x-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Orders</span>
            </Link>
            <span>/</span>
            <span className="text-t font-mono">Order #{order.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
              {`Order #${order.id}`}
            </h1>
            <StatusPill status={order.status} />
          </div>
          <p className="text-[14px] text-t2 font-sans mt-0.5">
            Submitted on {new Date(order.created_at).toLocaleString()} • Customer: {order.customer_name || 'You'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="btn-secondary min-h-[40px] px-4 text-[13px] border-no text-no hover:bg-no/10"
            >
              Cancel Order
            </button>
          )}
          <Link
            to="/orders/new"
            className="btn-primary min-h-[40px] px-4 text-[13px] shadow-[0_0_20px_rgba(229,9,20,0.35)]"
          >
            Reorder Similar
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

      {/* Fulfillment Progress Timeline Card */}
      <div className="card-base space-y-4">
        <h2 className="text-[20px] font-bold text-t flex items-center space-x-2">
          <Clock className="h-4 w-4 text-ac" />
          <span>Fulfillment progress timeline</span>
        </h2>

        {isCancelled ? (
          <div className="p-4 rounded-card border border-no/30 bg-[#291313] text-no text-[13px] flex items-center space-x-3">
            <XCircle className="h-5 w-5 shrink-0" />
            <div>
              <span className="font-semibold block">Order cancelled</span>
              <span>This order has been cancelled and will not receive inventory allocation.</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {timelineSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-card border transition-all ${
                  step.completed
                    ? 'border-ok/30 bg-ok/5'
                    : 'border-bd bg-s2/40 opacity-50'
                }`}
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      step.completed
                        ? 'bg-ok text-black'
                        : 'border border-bd text-t2'
                    }`}
                  >
                    {step.completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[13px] font-semibold ${
                      step.completed ? 'text-t' : 'text-t2'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                <p className="text-[12px] text-t2 font-sans">{step.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commitments & Business Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-base space-y-2">
          <div className="flex items-center space-x-2 text-t2 text-[12px] font-mono">
            <Calendar className="h-3.5 w-3.5 text-ac" />
            <span>Promised delivery date</span>
          </div>
          <div className="text-[18px] font-bold text-t">
            {order.promised_delivery_date || 'Standard commercial delivery schedule'}
          </div>
          <p className="text-[13px] text-t2">
            Priority-based allocation resolves customer delivery commitments using strict date sequencing.
          </p>
        </div>

        <div className="card-base space-y-2">
          <div className="flex items-center space-x-2 text-t2 text-[12px] font-mono">
            <FileText className="h-3.5 w-3.5 text-ac" />
            <span>Business context &amp; notes</span>
          </div>
          <div className="text-t text-[14px] leading-relaxed italic">
            &ldquo;{order.business_notes || 'No customer business notes attached to this order submission.'}&rdquo;
          </div>
        </div>
      </div>

      {/* Order Items Breakdown & Allocation Explanations */}
      <div className="card-base space-y-4">
        <div className="flex items-center justify-between border-b border-bd pb-4">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-ac" />
            <h2 className="text-[20px] font-bold text-t">
              Order items &amp; allocation explanations ({order.items?.length || 0})
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          {order.items?.map((item) => {
            const hasAllocated = item.allocation_status !== null && item.allocation_status !== undefined;
            const isDeferred = item.allocation_status === 'deferred';
            const isPartial = item.allocation_status === 'partially_fulfilled';
            const isFulfilled = item.allocation_status === 'fulfilled';

            return (
              <div
                key={item.id}
                className="bg-s2 border border-bd rounded-card p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bd/60 pb-3">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-[16px] text-t">
                        {item.product_name}
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-pill bg-s border border-bd text-t2">
                        {item.sku || item.product_sku}
                      </span>
                    </div>
                    <span className="text-[12px] font-mono text-t2 mt-0.5 block">
                      Unit: {item.unit || 'units'} • Partial delivery allowed:{' '}
                      <span className="font-semibold text-t">
                        {item.partial_delivery_allowed ? 'Yes' : 'No'}
                      </span>
                    </span>
                  </div>

                  <div>
                    {hasAllocated ? (
                      <StatusPill status={item.allocation_status} />
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 text-[12px] font-mono font-medium rounded-pill border border-bd text-t2 bg-s">
                        <Clock className="h-3 w-3" />
                        <span>Pending Run</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantitative Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-s rounded-card border border-bd">
                    <span className="text-[11px] font-mono text-t2 block">
                      Requested
                    </span>
                    <span className="text-[18px] font-bold text-t font-mono">
                      {item.requested_quantity}
                    </span>
                  </div>

                  <div className="p-3 bg-s rounded-card border border-bd">
                    <span className="text-[11px] font-mono text-t2 block">
                      Min Acceptable
                    </span>
                    <span className="text-[18px] font-bold text-t font-mono">
                      {item.minimum_acceptable_quantity}
                    </span>
                  </div>

                  <div className="p-3 bg-s rounded-card border border-bd">
                    <span className="text-[11px] font-mono text-t2 block">
                      Allocated
                    </span>
                    <span
                      className={`text-[18px] font-bold font-mono ${
                        isFulfilled
                          ? 'text-ok'
                          : isPartial
                          ? 'text-wa'
                          : isDeferred
                          ? 'text-no'
                          : 'text-t2'
                      }`}
                    >
                      {hasAllocated ? item.allocated_quantity : '—'}
                    </span>
                  </div>

                  <div className="p-3 bg-s rounded-card border border-bd">
                    <span className="text-[11px] font-mono text-t2 block">
                      Fulfillment Rate
                    </span>
                    <span className="text-[18px] font-bold text-t font-mono">
                      {hasAllocated
                        ? `${Math.round((item.allocated_quantity / item.requested_quantity) * 100)}%`
                        : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Plain-English Allocation Explanation Callout */}
                <div
                  className={`p-4 rounded-card border text-[13px] flex items-start space-x-3 ${
                    isFulfilled
                      ? 'border-ok/30 bg-ok/5 text-t'
                      : isPartial
                      ? 'border-wa/30 bg-wa/5 text-t'
                      : isDeferred
                      ? 'border-no/30 bg-[#291313] text-t'
                      : 'border-bd bg-s text-t2'
                  }`}
                >
                  <Info
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      isFulfilled
                        ? 'text-ok'
                        : isPartial
                        ? 'text-wa'
                        : isDeferred
                        ? 'text-no'
                        : 'text-t2'
                    }`}
                  />
                  <div>
                    <span className="text-[11px] font-mono font-medium uppercase tracking-wider block mb-0.5 text-t2">
                      {hasAllocated
                        ? 'Allocation engine explanation'
                        : 'Allocation engine status'}
                    </span>
                    <p className="leading-relaxed">
                      {hasAllocated
                        ? typeof (item.allocation_explanation || item.explanation) === 'object' &&
                          (item.allocation_explanation || item.explanation) !== null
                          ? (item.allocation_explanation || item.explanation).reason ||
                            JSON.stringify(item.allocation_explanation || item.explanation)
                          : item.allocation_explanation || item.explanation || 'Allocation processed.'
                        : 'No allocation yet — pending allocation run. The deterministic allocation engine has not processed this order item yet.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`Cancel Order #${order.id}`}
      >
        <div className="space-y-4 text-sm font-sans">
          <p className="text-t2">
            Are you sure you want to cancel Order #{order.id}? Once cancelled, any allocated stock will be released back to the warehouse.
          </p>
          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Cancellation reason (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Project rescheduled, redundant order"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-s2 border border-bd rounded-pill px-4 py-2.5 text-t focus:border-ac focus:outline-none text-[14px]"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="btn-secondary min-h-[40px] px-4 text-[13px]"
            >
              Keep order
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="btn-primary min-h-[40px] px-4 text-[13px] bg-no hover:bg-no/90 disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Confirm cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
