import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  RefreshCw,
  Quote,
  ShieldAlert,
  Info,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  BookmarkCheck,
} from 'lucide-react';
import apiClient from '../../api/client';
import { PriorityPill, ConfidencePill, RecommendationStatusPill } from '../../components/ui/StatusPill';
import Modal from '../../components/ui/Modal';

export default function AIRecommendations() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState('all'); // all, pending, approved, overridden, rejected
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal state for Modify action
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState(null);
  const [overridePriority, setOverridePriority] = useState('HIGH');
  const [overrideReason, setOverrideReason] = useState('');

  // Expandable details state per order
  const [expandedOrders, setExpandedOrders] = useState({});

  // Auth helper: ensures token exists for admin demo
  const ensureAdminAuth = async () => {
    let token = localStorage.getItem('orderwise_token');
    if (!token) {
      try {
        const res = await apiClient.post('/auth/login', {
          email: 'admin@orderwise.com',
          password: 'Admin123!',
        });
        if (res.data?.token) {
          localStorage.setItem('orderwise_token', res.data.token);
        }
      } catch (err) {
        console.warn('Auto-login error:', err);
      }
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureAdminAuth();
      const res = await apiClient.get('/orders');
      setOrders(res.data?.orders || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Request new AI recommendation
  const handleRequestRecommendation = async (orderId) => {
    setActionLoading((prev) => ({ ...prev, [`rec-${orderId}`]: true }));
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await apiClient.post(`/ai/recommend/${orderId}`, {});
      setSuccessMessage(`AI Priority Recommendation generated for Order #${orderId}!`);
      await fetchOrders();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to generate recommendation');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`rec-${orderId}`]: false }));
    }
  };

  // Approve recommendation
  const handleApprove = async (recommendation) => {
    setActionLoading((prev) => ({ ...prev, [`approve-${recommendation.id}`]: true }));
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.post('/priorities/approve', {
        recommendation_id: recommendation.id,
        decision: 'approved',
        reason: 'Approved AI recommendation via admin console',
      });
      setSuccessMessage(
        `Recommendation #${recommendation.id} approved! Order priority updated to ${recommendation.suggested_priority}.`
      );
      await fetchOrders();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to approve recommendation');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`approve-${recommendation.id}`]: false }));
    }
  };

  // Reject recommendation
  const handleReject = async (recommendation) => {
    setActionLoading((prev) => ({ ...prev, [`reject-${recommendation.id}`]: true }));
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.post('/priorities/approve', {
        recommendation_id: recommendation.id,
        decision: 'rejected',
        reason: 'Rejected recommendation - business context does not warrant suggested priority',
      });
      setSuccessMessage(
        `Recommendation #${recommendation.id} rejected. Authoritative priority remains unchanged.`
      );
      await fetchOrders();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to reject recommendation');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`reject-${recommendation.id}`]: false }));
    }
  };

  // Open Modify modal
  const openModifyModal = (recommendation) => {
    setActiveRecommendation(recommendation);
    setOverridePriority(recommendation.suggested_priority || 'HIGH');
    setOverrideReason('');
    setModifyModalOpen(true);
  };

  // Submit Modify override
  const handleModifySubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setError('An override rationale is required to document priority modification.');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [`modify-${activeRecommendation.id}`]: true }));
    setError(null);
    try {
      await apiClient.post('/priorities/approve', {
        recommendation_id: activeRecommendation.id,
        decision: 'overridden',
        final_priority: overridePriority,
        override_reason: overrideReason.trim(),
      });
      setSuccessMessage(
        `Priority modified to ${overridePriority} with governance audit log.`
      );
      setModifyModalOpen(false);
      await fetchOrders();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to modify priority');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`modify-${activeRecommendation?.id}`]: false }));
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const rec = order.latest_recommendation;
    if (filter === 'all') return true;
    if (filter === 'pending') return rec && rec.status === 'pending';
    if (filter === 'approved') return rec && rec.status === 'approved';
    if (filter === 'overridden') return rec && rec.status === 'overridden';
    if (filter === 'rejected') return rec && rec.status === 'rejected';
    if (filter === 'no_rec') return !rec;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-arcade-border bg-arcade-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="p-2 bg-arcade-accent/10 border border-arcade-accent/30 text-arcade-accent">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="font-display font-black text-2xl uppercase tracking-wider text-arcade-primary">
                AI Priority Assistant
              </h1>
              <span className="text-[10px] px-2 py-0.5 border border-arcade-accent/40 bg-arcade-accent/10 text-arcade-accent font-semibold uppercase">
                Groq Llama-3
              </span>
            </div>
            <p className="text-xs text-arcade-secondary">
              Core Principle:{' '}
              <span className="text-arcade-primary font-semibold">
                AI recommends. Business rules validate. Authorized humans approve. OrderWise allocates.
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-xs border border-arcade-border hover:border-arcade-accent text-arcade-primary bg-arcade-surface transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-arcade-border text-xs">
          <div className="p-3 bg-arcade-surface border border-arcade-border">
            <span className="text-arcade-secondary block text-[10px] uppercase">Total Orders</span>
            <span className="text-xl font-display font-black text-arcade-primary">{orders.length}</span>
          </div>
          <div className="p-3 bg-arcade-surface border border-arcade-warning/30">
            <span className="text-arcade-warning block text-[10px] uppercase">Pending AI Review</span>
            <span className="text-xl font-display font-black text-arcade-warning">
              {orders.filter((o) => o.latest_recommendation?.status === 'pending').length}
            </span>
          </div>
          <div className="p-3 bg-arcade-surface border border-arcade-success/30">
            <span className="text-arcade-success block text-[10px] uppercase">Human Approved</span>
            <span className="text-xl font-display font-black text-arcade-success">
              {orders.filter((o) => o.latest_recommendation?.status === 'approved').length}
            </span>
          </div>
          <div className="p-3 bg-arcade-surface border border-arcade-accent/30">
            <span className="text-arcade-accent block text-[10px] uppercase">Human Modified</span>
            <span className="text-xl font-display font-black text-arcade-accent">
              {orders.filter((o) => o.latest_recommendation?.status === 'overridden').length}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 bg-arcade-danger/10 border border-arcade-danger/40 text-arcade-danger text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-arcade-success/10 border border-arcade-success/40 text-arcade-success text-xs flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-arcade-border pb-3">
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'pending', label: 'Pending Review' },
          { key: 'approved', label: 'Approved' },
          { key: 'overridden', label: 'Modified' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'no_rec', label: 'Needs AI Analysis' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${
              filter === t.key
                ? 'border-arcade-accent bg-arcade-accent/15 text-arcade-accent'
                : 'border-arcade-border bg-arcade-surface text-arcade-secondary hover:text-arcade-primary hover:border-arcade-border-light'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders & Recommendations List */}
      {loading ? (
        <div className="p-12 text-center text-arcade-secondary border border-arcade-border bg-arcade-card">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-arcade-accent" />
          <p className="text-xs uppercase tracking-wider">Loading orders & AI priority recommendations...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center text-arcade-secondary border border-arcade-border bg-arcade-card">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs uppercase tracking-wider">No orders found for selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const rec = order.latest_recommendation;
            const isExpanded = !!expandedOrders[order.id];

            return (
              <div
                key={order.id}
                className="border border-arcade-border bg-arcade-card transition-all hover:border-arcade-border-light"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-arcade-border/50">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-black text-lg text-arcade-primary">
                        ORDER #{order.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 border border-arcade-border bg-arcade-surface text-arcade-secondary uppercase">
                        Status: {order.status}
                      </span>
                      {/* Authoritative Priority Badge */}
                      <div className="flex items-center space-x-1.5 text-xs">
                        <span className="text-arcade-secondary text-[11px]">Authoritative Priority:</span>
                        <PriorityPill priority={order.approved_priority || 'MEDIUM'} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-arcade-secondary">
                      <span>Customer: <strong className="text-arcade-primary">{order.customer_name}</strong></span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Promised:{' '}
                        <strong className="text-arcade-primary">
                          {order.promised_delivery_date
                            ? new Date(order.promised_delivery_date).toLocaleDateString()
                            : 'N/A'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions / Rec Request */}
                  <div className="flex items-center space-x-2">
                    {!rec ? (
                      <button
                        onClick={() => handleRequestRecommendation(order.id)}
                        disabled={actionLoading[`rec-${order.id}`]}
                        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold bg-arcade-accent text-arcade-surface border border-arcade-accent hover:bg-arcade-accent/90 transition-colors shadow-[0_0_10px_rgba(200,255,58,0.2)]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {actionLoading[`rec-${order.id}`] ? 'Analyzing...' : 'Request AI Analysis'}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequestRecommendation(order.id)}
                        disabled={actionLoading[`rec-${order.id}`]}
                        title="Re-run AI Analysis"
                        className="flex items-center space-x-1 px-2.5 py-1 text-[11px] border border-arcade-border text-arcade-secondary hover:text-arcade-primary bg-arcade-surface transition-colors"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${actionLoading[`rec-${order.id}`] ? 'animate-spin' : ''}`}
                        />
                        <span>Re-Analyze</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="p-1.5 border border-arcade-border text-arcade-secondary hover:text-arcade-primary transition-colors"
                      title={isExpanded ? 'Collapse Items' : 'Expand Items'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Items Accordion (if expanded) */}
                {isExpanded && order.items && order.items.length > 0 && (
                  <div className="p-4 bg-arcade-surface/60 border-b border-arcade-border text-xs space-y-2">
                    <span className="text-[10px] text-arcade-secondary uppercase tracking-widest block font-bold">
                      Order Items:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {order.items.map((it) => (
                        <div key={it.id} className="p-2 border border-arcade-border bg-arcade-card space-y-0.5">
                          <div className="font-semibold text-arcade-primary">{it.product_name}</div>
                          <div className="text-[11px] text-arcade-secondary">
                            SKU: {it.sku} • Requested: <strong>{it.requested_quantity}</strong> (Min: {it.minimum_acceptable_quantity})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Business Notes */}
                {order.business_notes && (
                  <div className="px-5 py-3 bg-arcade-surface/40 border-b border-arcade-border/40 text-xs flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-arcade-secondary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-arcade-secondary uppercase tracking-wider block font-semibold">
                        Customer Business Notes (Treated Strictly as Data):
                      </span>
                      <p className="text-arcade-primary/90 italic">"{order.business_notes}"</p>
                    </div>
                  </div>
                )}

                {/* AI Recommendation Box */}
                {rec ? (
                  <div className="p-5 bg-arcade-neutral/40 space-y-4">
                    {/* Recommendation Top Metadata Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-arcade-border/50">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-arcade-secondary font-semibold uppercase">
                          AI Suggested Priority:
                        </span>
                        <PriorityPill priority={rec.suggested_priority} className="text-sm px-3 py-1" />
                        <ConfidencePill confidence={rec.confidence} />
                        <RecommendationStatusPill status={rec.status} />
                      </div>

                      {/* NEW: Traceability Badges (Model & Prompt Version) */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-arcade-secondary">
                        <span
                          className={`px-2 py-0.5 border ${
                            rec.provider === 'fallback'
                              ? 'border-arcade-warning/40 bg-arcade-warning/10 text-arcade-warning'
                              : 'border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent'
                          } font-semibold uppercase`}
                        >
                          Provider: {rec.provider === 'fallback' ? 'Rule-Based Fallback' : 'Groq AI'}
                        </span>
                        <span className="px-2 py-0.5 border border-arcade-border bg-arcade-surface font-mono">
                          Model: {rec.model || 'llama3-70b-8192'}
                        </span>
                        <span className="px-2 py-0.5 border border-arcade-border bg-arcade-surface font-mono">
                          Prompt: {rec.prompt_version || 'v1.0.0'}
                        </span>
                      </div>
                    </div>

                    {/* Recommendation Explanation */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-arcade-secondary uppercase tracking-widest font-bold block mb-1">
                          Rationale & Explanation:
                        </span>
                        <p className="text-arcade-primary leading-relaxed bg-arcade-card p-3 border border-arcade-border">
                          {rec.explanation}
                        </p>
                      </div>

                      {/* Supporting Evidence Quote */}
                      {rec.evidence && (
                        <div>
                          <span className="text-[10px] text-arcade-secondary uppercase tracking-widest font-bold block mb-1">
                            Supporting Evidence:
                          </span>
                          <div className="flex items-start space-x-2 p-2.5 bg-arcade-surface border border-arcade-border text-arcade-secondary">
                            <Quote className="w-3.5 h-3.5 text-arcade-accent flex-shrink-0 mt-0.5" />
                            <span className="italic text-arcade-primary/90">{rec.evidence}</span>
                          </div>
                        </div>
                      )}

                      {/* Warning Banner */}
                      {rec.warning && (
                        <div className="p-3 bg-arcade-warning/10 border border-arcade-warning/30 text-arcade-warning flex items-start space-x-2 text-[11px]">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{rec.warning}</span>
                        </div>
                      )}
                    </div>

                    {/* Human Decision Governance Actions */}
                    <div className="pt-3 border-t border-arcade-border/50 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-arcade-secondary">
                        {rec.status === 'pending' ? (
                          <span className="text-arcade-warning font-semibold">
                            ⚠️ Awaiting authorized human review before updating authoritative priority.
                          </span>
                        ) : rec.status === 'approved' ? (
                          <span className="text-arcade-success font-semibold flex items-center gap-1">
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            Approved by Admin • Authoritative Priority updated to {order.approved_priority}.
                          </span>
                        ) : rec.status === 'overridden' ? (
                          <span className="text-arcade-accent font-semibold flex items-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" />
                            Modified by Admin • Authoritative Priority set to {order.approved_priority}.
                          </span>
                        ) : (
                          <span className="text-arcade-danger font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Recommendation Rejected • Original priority remained unchanged.
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Approve Action */}
                        <button
                          onClick={() => handleApprove(rec)}
                          disabled={actionLoading[`approve-${rec.id}`]}
                          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-arcade-success/20 hover:bg-arcade-success/30 text-arcade-success border border-arcade-success/50 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        {/* Modify Action */}
                        <button
                          onClick={() => openModifyModal(rec)}
                          disabled={actionLoading[`modify-${rec.id}`]}
                          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-arcade-accent/15 hover:bg-arcade-accent/25 text-arcade-accent border border-arcade-accent/50 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modify</span>
                        </button>

                        {/* Reject Action */}
                        <button
                          onClick={() => handleReject(rec)}
                          disabled={actionLoading[`reject-${rec.id}`]}
                          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-arcade-danger/15 hover:bg-arcade-danger/25 text-arcade-danger border border-arcade-danger/50 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-arcade-surface/30 text-xs text-arcade-secondary flex items-center justify-between">
                    <span>No AI recommendation on record for this order.</span>
                    <button
                      onClick={() => handleRequestRecommendation(order.id)}
                      disabled={actionLoading[`rec-${order.id}`]}
                      className="text-xs text-arcade-accent hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Sparkles className="w-3 h-3" />
                      Run AI Priority Assistant
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modify Modal Dialog */}
      <Modal
        isOpen={modifyModalOpen}
        onClose={() => setModifyModalOpen(false)}
        title="Modify AI Priority Recommendation"
      >
        <form onSubmit={handleModifySubmit} className="space-y-4 text-xs">
          <div>
            <span className="text-arcade-secondary block text-[11px] mb-1">AI Recommendation ID:</span>
            <div className="p-2 bg-arcade-surface border border-arcade-border font-mono text-arcade-primary">
              #{activeRecommendation?.id} • Suggested: {activeRecommendation?.suggested_priority}
            </div>
          </div>

          <div>
            <label className="block text-arcade-primary font-semibold mb-1">
              Select Authoritative Priority:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setOverridePriority(p)}
                  className={`p-2.5 border text-center font-bold tracking-wider uppercase transition-colors ${
                    overridePriority === p
                      ? 'border-arcade-accent bg-arcade-accent/20 text-arcade-accent'
                      : 'border-arcade-border bg-arcade-surface text-arcade-secondary hover:text-arcade-primary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-arcade-primary font-semibold mb-1">
              Modification Rationale / Justification <span className="text-arcade-danger">*</span>:
            </label>
            <textarea
              rows={3}
              required
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. VIP client SLA requires expedited priority classification despite standard business notes."
              className="w-full p-2.5 bg-arcade-surface border border-arcade-border text-arcade-primary focus:border-arcade-accent focus:outline-none"
            />
            <span className="text-[10px] text-arcade-secondary mt-1 block">
              This reason will be permanently recorded in priority_approvals and audit_logs.
            </span>
          </div>

          <div className="pt-4 border-t border-arcade-border flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setModifyModalOpen(false)}
              className="px-4 py-2 border border-arcade-border text-arcade-secondary hover:text-arcade-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading[`modify-${activeRecommendation?.id}`]}
              className="px-4 py-2 bg-arcade-accent text-arcade-surface font-semibold uppercase tracking-wider hover:bg-arcade-accent/90 transition-colors"
            >
              Confirm Modification
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
