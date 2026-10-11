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
      <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex flex-col items-center justify-center space-y-3 font-mono my-8">
        <RefreshCw className="h-6 w-6 animate-spin text-arcade-accent" />
        <span className="text-xs uppercase tracking-wider">Loading order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary space-y-3 font-mono my-8">
        <AlertTriangle className="h-8 w-8 text-arcade-warning mx-auto" />
        <h2 className="font-display text-xl uppercase font-bold text-arcade-primary">
          Order #{id} Not Found
        </h2>
        <p className="text-xs">
          This order does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/orders"
          className="inline-block px-4 py-2 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  // Determine Timeline Progress
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
    <div className="space-y-6 font-mono py-4">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-arcade-secondary mb-2">
            <Link to="/orders" className="hover:text-arcade-primary flex items-center space-x-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Orders</span>
            </Link>
            <span>/</span>
            <span className="text-arcade-accent">Order #{order.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
              Order #{order.id}
            </h1>
            <StatusPill status={order.status} />
          </div>
          <p className="text-xs text-arcade-secondary mt-1">
            Submitted on {new Date(order.created_at).toLocaleString()} • Customer: {order.customer_name || 'You'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="px-3.5 py-2 border border-arcade-danger/60 text-arcade-danger hover:bg-arcade-danger/10 text-xs uppercase tracking-wider transition-colors"
            >
              Cancel Order
            </button>
          )}
          <Link
            to="/orders/new"
            className="px-3.5 py-2 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Reorder Similar
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

      {/* Customer-Friendly Status Timeline */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 space-y-4">
        <h2 className="font-display text-base uppercase font-bold text-arcade-primary flex items-center space-x-2">
          <Clock className="h-4 w-4 text-arcade-accent" />
          <span>Fulfillment Progress Timeline</span>
        </h2>

        {isCancelled ? (
          <div className="p-4 border border-arcade-danger/40 bg-arcade-danger/10 text-arcade-danger text-xs flex items-center space-x-3">
            <XCircle className="h-5 w-5 shrink-0" />
            <div>
              <span className="font-bold uppercase block">Order Cancelled</span>
              <span>This order has been cancelled and will not receive inventory allocation.</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            {timelineSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-4 border transition-all ${
                  step.completed
                    ? 'border-arcade-accent/60 bg-arcade-accent/5'
                    : 'border-arcade-border bg-arcade-surface/40 opacity-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1.5">
                  <div
                    className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border ${
                      step.completed
                        ? 'border-arcade-accent bg-arcade-accent text-arcade-surface'
                        : 'border-arcade-border text-arcade-secondary'
                    }`}
                  >
                    {step.completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs uppercase font-bold tracking-wider ${
                      step.completed ? 'text-arcade-primary' : 'text-arcade-secondary'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                <p className="text-[11px] text-arcade-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commitments & Business Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-2">
          <div className="flex items-center space-x-2 text-arcade-secondary uppercase text-[10px] tracking-wider">
            <Calendar className="h-3.5 w-3.5 text-arcade-accent" />
            <span>Promised Delivery Date</span>
          </div>
          <div className="text-base font-bold text-arcade-primary">
            {order.promised_delivery_date || 'Standard Commercial Delivery Schedule'}
          </div>
          <p className="text-[11px] text-arcade-secondary">
            Priority-based allocation resolves customer delivery commitments using strict date sequencing.
          </p>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-2">
          <div className="flex items-center space-x-2 text-arcade-secondary uppercase text-[10px] tracking-wider">
            <FileText className="h-3.5 w-3.5 text-arcade-accent" />
            <span>Business Context &amp; Notes</span>
          </div>
          <div className="text-arcade-primary text-xs leading-relaxed italic">
            &ldquo;{order.business_notes || 'No customer business notes attached to this order submission.'}&rdquo;
          </div>
        </div>
      </div>

      {/* Order Items Breakdown & Allocation Explanations */}
      <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-arcade-border pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-arcade-accent" />
            <h2 className="font-display text-base uppercase font-bold text-arcade-primary">
              Order Items &amp; Allocation Explanations ({order.items?.length || 0})
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
                className="border border-arcade-border bg-arcade-surface p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-arcade-border/60 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-base text-arcade-primary">
                        {item.product_name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-arcade-neutral border border-arcade-border text-arcade-accent">
                        {item.sku}
                      </span>
                    </div>
                    <span className="text-[11px] text-arcade-secondary mt-0.5 block">
                      Unit: {item.unit || 'units'} • Partial Delivery Allowed:{' '}
                      <span className="font-semibold text-arcade-primary">
                        {item.partial_delivery_allowed ? 'Yes' : 'No'}
                      </span>
                    </span>
                  </div>

                  <div>
                    {hasAllocated ? (
                      <StatusPill status={item.allocation_status} />
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border border-arcade-border text-arcade-secondary bg-arcade-neutral">
                        <Clock className="h-3 w-3" />
                        <span>Pending Run</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantitative Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-arcade-neutral border border-arcade-border">
                    <span className="text-[10px] uppercase text-arcade-secondary block">
                      Requested
                    </span>
                    <span className="text-base font-bold text-arcade-primary">
                      {item.requested_quantity}
                    </span>
                  </div>

                  <div className="p-2.5 bg-arcade-neutral border border-arcade-border">
                    <span className="text-[10px] uppercase text-arcade-secondary block">
                      Min Acceptable
                    </span>
                    <span className="text-base font-bold text-arcade-primary">
                      {item.minimum_acceptable_quantity}
                    </span>
                  </div>

                  <div className="p-2.5 bg-arcade-neutral border border-arcade-border">
                    <span className="text-[10px] uppercase text-arcade-secondary block">
                      Allocated
                    </span>
                    <span
                      className={`text-base font-bold ${
                        isFulfilled
                          ? 'text-arcade-accent'
                          : isPartial
                          ? 'text-arcade-warning'
                          : isDeferred
                          ? 'text-arcade-danger'
                          : 'text-arcade-secondary'
                      }`}
                    >
                      {hasAllocated ? item.allocated_quantity : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-arcade-neutral border border-arcade-border">
                    <span className="text-[10px] uppercase text-arcade-secondary block">
                      Fulfillment Rate
                    </span>
                    <span className="text-base font-bold text-arcade-primary">
                      {hasAllocated
                        ? `${Math.round((item.allocated_quantity / item.requested_quantity) * 100)}%`
                        : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Plain-English Allocation Explanation Callout */}
                <div
                  className={`p-3.5 border text-xs flex items-start space-x-2.5 ${
                    isFulfilled
                      ? 'border-arcade-accent/30 bg-arcade-accent/5 text-arcade-primary'
                      : isPartial
                      ? 'border-arcade-warning/30 bg-arcade-warning/5 text-arcade-primary'
                      : isDeferred
                      ? 'border-arcade-danger/30 bg-arcade-danger/5 text-arcade-primary'
                      : 'border-arcade-border bg-arcade-neutral text-arcade-secondary'
                  }`}
                >
                  <Info
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      isFulfilled
                        ? 'text-arcade-accent'
                        : isPartial
                        ? 'text-arcade-warning'
                        : isDeferred
                        ? 'text-arcade-danger'
                        : 'text-arcade-secondary'
                    }`}
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider block mb-0.5 text-arcade-secondary">
                      {hasAllocated
                        ? 'Allocation Engine Explanation'
                        : 'Allocation Engine Status'}
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
        <div className="space-y-4 text-xs">
          <p className="text-arcade-secondary">
            Are you sure you want to cancel Order #{order.id}? Once cancelled, any allocated stock will be released back to the warehouse.
          </p>
          <div>
            <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
              Cancellation Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Project rescheduled, redundant order"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="px-3 py-1.5 border border-arcade-border text-arcade-secondary hover:text-arcade-primary uppercase text-xs"
            >
              Keep Order
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-4 py-1.5 bg-arcade-danger text-white uppercase text-xs font-bold hover:opacity-90 disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
