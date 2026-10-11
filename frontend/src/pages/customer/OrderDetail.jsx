import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import StatusPill from '../../components/ui/StatusPill';
import Skeleton from '../../components/ui/Skeleton';
import Alert from '../../components/ui/Alert';
import Toast from '../../components/ui/Toast';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Package,
  Layers,
  FileText,
  ShieldCheck,
  Hourglass,
  Check,
} from 'lucide-react';

export function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setLoading(true);
      try {
        const res = await apiClient.get(`/orders/${id}`);
        const orderData = res.order || res.data?.order || res;
        if (isMounted) {
          setOrder(orderData);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load order details:', err);
          setErrorMessage(err.error?.message || err.message || 'Order not found or access denied');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="p-8 bg-white rounded-2xl border border-slate-200 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-4 gap-4 pt-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Unable to load order</h2>
        <p className="text-sm text-slate-500">
          {errorMessage || 'The requested order could not be retrieved. Please check permissions.'}
        </p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  const items = order.items || [];
  const timeline = order.timeline || [];
  const hasAllocations = items.some((it) => it.latest_allocation !== null);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Navigation header */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Order #{order.id}
              </h1>
              <StatusPill status={order.display_status || order.status} />
              <StatusPill status={order.priority || 'MEDIUM'} type="priority" size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-4">
              <span>Placed on: {new Date(order.created_at).toLocaleString()}</span>
              <span>•</span>
              <span>
                Promised Target:{' '}
                {order.promised_delivery_date
                  ? new Date(order.promised_delivery_date).toLocaleDateString()
                  : 'Flexible'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Customer-Friendly Status Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Order Progress & Allocation Timeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent status track from order placement to deterministic inventory allocation.
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {timeline.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';
              const isCancelled = step.status === 'cancelled';

              let circleClass = 'bg-slate-100 text-slate-400 border-slate-300';
              if (isCompleted) circleClass = 'bg-emerald-600 text-white border-emerald-600';
              else if (isInProgress) circleClass = 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-50';
              else if (isCancelled) circleClass = 'bg-rose-600 text-white border-rose-600';

              return (
                <div key={step.key || idx} className="flex flex-col space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${circleClass}`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{step.title}</div>
                  </div>

                  <p className="text-xs text-slate-500 pl-11 leading-relaxed">
                    {step.description}
                  </p>

                  {step.timestamp && (
                    <p className="text-[10px] text-slate-400 pl-11 font-mono">
                      {new Date(step.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Line Items Breakdown Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Line Items & Allocation Results</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare requested units against engine allocations and review fulfillment reasons.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item, index) => {
            const hasAlloc = item.latest_allocation !== null;
            const alloc = item.latest_allocation;
            const itemStatus = hasAlloc ? alloc.status : 'pending';

            return (
              <div key={item.id || index} className="p-6 space-y-4 hover:bg-slate-50/40 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {item.product_sku || 'SKU'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {item.product_name || `Product #${item.product_id}`}
                      </h3>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>Requested: <strong>{item.requested_quantity}</strong> {item.product_unit || 'units'}</span>
                      <span>•</span>
                      <span>
                        Min Threshold: <strong>{item.minimum_acceptable_quantity}</strong> {item.product_unit || 'units'}
                      </span>
                      <span>•</span>
                      <span>
                        Partial Allowed: <strong>{item.partial_delivery_allowed ? 'Yes' : 'No'}</strong>
                      </span>
                    </div>
                  </div>

                  <div>
                    {hasAlloc ? (
                      <StatusPill status={itemStatus} />
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <Hourglass className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        No allocation yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Allocation Box */}
                {hasAlloc ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Allocated Units:</span>
                        <span className="text-base font-extrabold text-slate-900">
                          {alloc.allocated_quantity} of {item.requested_quantity}
                        </span>
                        <span className="text-slate-400">({item.product_unit || 'units'})</span>
                      </div>

                      {alloc.run_at && (
                        <div className="text-slate-400 font-mono text-[11px]">
                          Processed at: {new Date(alloc.run_at).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Explanation text */}
                    {alloc.explanation && (
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                        <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>Allocation Explanation:</span>
                        </div>
                        <p>{alloc.explanation}</p>
                      </div>
                    )}

                    {/* Customer-friendly "Why was my order deferred?" block */}
                    {itemStatus === 'deferred' && (
                      <div className="p-3.5 bg-rose-50/80 rounded-lg border border-rose-200 text-xs text-rose-900 space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5 text-rose-800">
                          <HelpCircle className="w-4 h-4 text-rose-600" />
                          <span>Why was this item deferred?</span>
                        </div>
                        <p className="leading-relaxed">
                          {alloc.explanation ||
                            'Available warehouse stock was insufficient to meet your order rules. Either stock was completely depleted by higher priority orders, or remaining stock fell below your minimum acceptable threshold.'}
                        </p>
                        <p className="text-[11px] text-rose-700/80 italic pt-1">
                          Our supply chain team has been alerted for automatic replenishment reorders.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 text-xs text-amber-900 flex items-start gap-3">
                    <Hourglass className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-950">Awaiting Allocation Run</h4>
                      <p className="mt-0.5 leading-relaxed text-amber-800">
                        This item has been queued for the next allocation engine batch. No stock has been distributed
                        yet. Our system never invents or approximates unverified quantities.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Business Notes Context Card */}
      {order.business_notes && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Business Notes Submitted With Order</span>
          </div>
          <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed font-mono">
            {order.business_notes}
          </p>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
