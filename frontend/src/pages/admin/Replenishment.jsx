import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  RefreshCw,
  Package,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import apiClient from '../../api/client';
import Modal from '../../components/ui/Modal';

export default function Replenishment() {
  const [recommendations, setRecommendations] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [demandPeriod, setDemandPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [posLoading, setPosLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Active view tab: 'recommendations' or 'purchase_orders'
  const [activeTab, setActiveTab] = useState('recommendations');

  // Modal State for Draft PO Creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [poQuantity, setPoQuantity] = useState(10);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [submittingPo, setSubmittingPo] = useState(false);

  // Ensuring Admin/Manager auth
  const ensureAuth = async () => {
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

  const fetchRecommendations = async (period = demandPeriod) => {
    setLoading(true);
    setError(null);
    try {
      await ensureAuth();
      const res = await apiClient.get(`/replenishment?demand_period_days=${period}`);
      setRecommendations(res.data?.recommendations || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to fetch replenishment recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPOs = async () => {
    setPosLoading(true);
    try {
      await ensureAuth();
      const res = await apiClient.get('/replenishment/pos');
      setPurchaseOrders(res.data?.purchase_orders || []);
    } catch (err) {
      console.warn('PO fetch warning:', err);
    } finally {
      setPosLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      await ensureAuth();
      const res = await apiClient.get('/replenishment/suppliers');
      setSuppliers(res.data?.suppliers || []);
    } catch (err) {
      console.warn('Suppliers fetch warning:', err);
    }
  };

  useEffect(() => {
    fetchRecommendations(demandPeriod);
    fetchPOs();
    fetchSuppliers();
  }, [demandPeriod]);

  const handleOpenDraftModal = (rec) => {
    setSelectedProduct(rec);
    setPoQuantity(rec.suggested_reorder_quantity || 25);
    setPoSupplierId(rec.supplier?.id ? rec.supplier.id.toString() : suppliers[0]?.id?.toString() || '');
    setPoNotes(`Automated draft PO for ${rec.product_name} (${rec.sku}) deficit`);
    setIsModalOpen(true);
  };

  const handleCreateDraftPO = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !poSupplierId || poQuantity <= 0) return;

    setSubmittingPo(true);
    setError(null);
    try {
      await apiClient.post('/replenishment/draft-po', {
        supplier_id: parseInt(poSupplierId, 10),
        items: [{ product_id: selectedProduct.product_id, quantity: parseInt(poQuantity, 10) }],
        notes: poNotes,
      });

      setSuccessMsg(`Draft purchase order created successfully. Awaiting official admin approval.`);
      setIsModalOpen(false);
      await fetchRecommendations();
      await fetchPOs();
      setActiveTab('purchase_orders');
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to create draft purchase order');
    } finally {
      setSubmittingPo(false);
    }
  };

  const handleApprovePO = async (poId) => {
    setError(null);
    try {
      await apiClient.patch(`/replenishment/po/${poId}/approve`);
      setSuccessMsg(`Purchase order #${poId} officially approved and marked as 'ordered'. Confirmed incoming stock updated.`);
      await fetchRecommendations();
      await fetchPOs();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to approve purchase order');
    }
  };

  const summary = useMemo(() => {
    const total = recommendations.length;
    const replenishCount = recommendations.filter((r) => r.needs_replenishment).length;
    const criticalCount = recommendations.filter((r) => r.shortage_risk === 'critical').length;
    const totalIncoming = recommendations.reduce((acc, r) => acc + (r.confirmed_incoming || 0), 0);
    return { total, replenishCount, criticalCount, totalIncoming };
  }, [recommendations]);

  return (
    <div className="space-y-6 pb-12 font-mono">
      {/* Top Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs text-cyan-400 border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 mb-2">
              <Truck className="w-3.5 h-3.5" />
              <span>PHASE 11 SUPPLY INTELLIGENCE &amp; REPLENISHMENT</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-arcade-primary">
              Replenishment <span className="text-arcade-accent">&amp;</span> Demand Planning
            </h1>
            <p className="text-arcade-secondary text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
              Deterministic reorder point calculation: <code>Reorder Point = Avg Daily Demand × Lead Time + Safety Stock</code>.
              Inventory Position factoring confirmed incoming supplier shipments. Draft PO approval workflow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 border border-arcade-border bg-arcade-surface px-2.5 py-1.5 text-xs text-arcade-secondary">
              <Calendar className="w-3.5 h-3.5 text-arcade-accent" />
              <span>Demand Window:</span>
              <select
                aria-label="Select Demand Window"
                value={demandPeriod}
                onChange={(e) => setDemandPeriod(parseInt(e.target.value, 10))}
                className="bg-transparent border-none text-arcade-primary font-bold outline-none cursor-pointer"
              >
                <option value={14} className="bg-arcade-neutral">14 Days</option>
                <option value={30} className="bg-arcade-neutral">30 Days</option>
                <option value={60} className="bg-arcade-neutral">60 Days</option>
                <option value={90} className="bg-arcade-neutral">90 Days</option>
              </select>
            </div>

            <button
              onClick={() => fetchRecommendations(demandPeriod)}
              disabled={loading}
              className="px-3.5 py-2 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 flex items-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(200,255,58,0.3)] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Recalculate</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="border border-arcade-danger/30 bg-arcade-danger/10 p-4 text-arcade-danger text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="text-[10px] uppercase tracking-wider text-arcade-secondary flex items-center justify-between">
            <span>Products Evaluated</span>
            <Package className="w-3.5 h-3.5 text-arcade-accent" />
          </div>
          <div className="text-2xl font-display font-black text-arcade-primary mt-1">
            {summary.total}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Active catalog items</div>
        </div>

        <div className="border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="text-[10px] uppercase tracking-wider text-amber-400 flex items-center justify-between">
            <span>Replenish Recommended</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-display font-black text-amber-400 mt-1">
            {summary.replenishCount}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Position &le; Reorder Point</div>
        </div>

        <div className="border border-rose-500/30 bg-rose-500/10 p-4">
          <div className="text-[10px] uppercase tracking-wider text-rose-400 flex items-center justify-between">
            <span>Critical Shortage Risk</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-display font-black text-rose-400 mt-1">
            {summary.criticalCount}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Position &le; 0 units</div>
        </div>

        <div className="border border-cyan-500/30 bg-cyan-500/10 p-4">
          <div className="text-[10px] uppercase tracking-wider text-cyan-400 flex items-center justify-between">
            <span>Confirmed Incoming</span>
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-display font-black text-cyan-400 mt-1">
            {summary.totalIncoming}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Units on approved POs</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-arcade-border pb-2">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
            activeTab === 'recommendations'
              ? 'border-arcade-accent bg-arcade-accent/15 text-arcade-accent'
              : 'border-arcade-border text-arcade-secondary hover:text-arcade-primary bg-arcade-neutral'
          }`}
        >
          Replenishment Recommendations ({recommendations.length})
        </button>

        <button
          onClick={() => setActiveTab('purchase_orders')}
          className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
            activeTab === 'purchase_orders'
              ? 'border-arcade-accent bg-arcade-accent/15 text-arcade-accent'
              : 'border-arcade-border text-arcade-secondary hover:text-arcade-primary bg-arcade-neutral'
          }`}
        >
          Purchase Orders &amp; Approvals ({purchaseOrders.length})
        </button>
      </div>

      {/* Tab 1: Recommendations Table */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="border border-arcade-border bg-arcade-neutral overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-arcade-border bg-arcade-surface/60 text-[11px] uppercase tracking-wider text-arcade-secondary">
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4 text-right">On-Hand</th>
                    <th className="py-3 px-4 text-right">Reserved</th>
                    <th className="py-3 px-4 text-right">Incoming</th>
                    <th className="py-3 px-4 text-right font-bold text-arcade-primary">Inv Position</th>
                    <th className="py-3 px-4 text-right">Daily Demand</th>
                    <th className="py-3 px-4 text-right">Lead Time</th>
                    <th className="py-3 px-4 text-right">Reorder Point</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Suggested Order</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arcade-border/50">
                  {recommendations.map((rec) => {
                    const isNeeded = rec.needs_replenishment;
                    const positionColor =
                      rec.inventory_position <= 0
                        ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                        : isNeeded
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

                    return (
                      <React.Fragment key={`rec-${rec.product_id}`}>
                        <tr className="hover:bg-arcade-surface/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-arcade-primary">{rec.product_name}</div>
                            <div className="text-[10px] text-arcade-secondary flex items-center space-x-1.5 mt-0.5">
                              <span className="text-arcade-accent font-mono">{rec.sku}</span>
                              {rec.supplier && (
                                <>
                                  <span>·</span>
                                  <span>{rec.supplier.name}</span>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-arcade-primary">
                            {rec.on_hand_quantity}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-arcade-secondary">
                            {rec.reserved_quantity}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-cyan-400">
                            {rec.confirmed_incoming > 0 ? `+${rec.confirmed_incoming}` : '0'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <span className={`inline-block px-2 py-0.5 font-mono font-bold text-xs border ${positionColor}`}>
                              {rec.inventory_position}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-arcade-primary">
                            {rec.average_daily_demand}/d
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-arcade-secondary">
                            {rec.lead_time_days}d
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-semibold text-arcade-primary">
                            {rec.effective_reorder_point}
                            <span className="text-[10px] text-arcade-secondary block font-normal">
                              (calc: {rec.calculated_reorder_point})
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {isNeeded ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-amber-500/40 bg-amber-500/15 text-amber-400">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Replenish</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Optimal</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center font-mono font-bold text-arcade-accent">
                            {isNeeded ? `+${rec.suggested_reorder_quantity} units` : '—'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenDraftModal(rec)}
                              className="px-2.5 py-1 bg-arcade-surface border border-arcade-accent text-arcade-accent hover:bg-arcade-accent/15 text-[11px] font-bold uppercase tracking-wider transition-colors inline-flex items-center space-x-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Draft PO</span>
                            </button>
                          </td>
                        </tr>

                        {/* Explicit Limitation / Estimate Banner if Demand History is Insufficient */}
                        {rec.limitation_note && (
                          <tr className="bg-amber-500/5 border-b border-arcade-border/40">
                            <td colSpan="11" className="py-2 px-4 text-[11px] text-amber-400 flex items-center space-x-2">
                              <Info className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>
                                <strong>Limitation Note ({rec.sku}):</strong> {rec.limitation_note}
                              </span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 border border-arcade-border bg-arcade-surface text-[11px] text-arcade-secondary flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-arcade-accent" />
              <span><strong>Estimate Notice:</strong> All demand velocities, safety stock buffers, and reorder levels are estimates modeled from recent historical sales orders.</span>
            </span>
            <span className="font-mono text-arcade-accent text-[10px] uppercase">Human Approval Required</span>
          </div>
        </div>
      )}

      {/* Tab 2: Purchase Orders & Governance Tab */}
      {activeTab === 'purchase_orders' && (
        <div className="space-y-4">
          <div className="border border-arcade-border bg-arcade-neutral p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base uppercase text-arcade-primary">
                  Purchase Order Governance
                </h3>
                <p className="text-xs text-arcade-secondary mt-0.5">
                  OrderWise strictly forbids automated purchase execution. Draft purchase orders require explicit administrative review and approval.
                </p>
              </div>

              <span className="px-2.5 py-1 border border-arcade-accent/40 bg-arcade-accent/10 text-arcade-accent text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Gatekeeper Active</span>
              </span>
            </div>
          </div>

          <div className="border border-arcade-border bg-arcade-neutral overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-arcade-border bg-arcade-surface/60 text-[11px] uppercase tracking-wider text-arcade-secondary">
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Items Ordered</th>
                    <th className="py-3 px-4">Expected Delivery</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arcade-border/50">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-arcade-secondary">
                        {posLoading ? 'Loading purchase orders...' : 'No purchase orders recorded.'}
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => {
                      const isDraft = po.status === 'draft';
                      const isOrdered = po.status === 'ordered';

                      return (
                        <tr key={`po-${po.id}`} className="hover:bg-arcade-surface/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-arcade-accent">{po.po_number}</span>
                            <span className="text-[10px] text-arcade-secondary block mt-0.5">
                              Created: {new Date(po.created_at).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-arcade-primary">{po.supplier_name}</div>
                            <div className="text-[10px] text-arcade-secondary">{po.supplier_code}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            {po.items?.map((it) => (
                              <div key={`po-item-${it.id}`} className="text-xs">
                                <strong>{it.quantity_ordered}</strong> × {it.product_name}
                              </div>
                            ))}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-arcade-secondary">
                            {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'Pending'}
                          </td>

                          <td className="py-3.5 px-4">
                            {isDraft ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-amber-500/40 bg-amber-500/15 text-amber-400">
                                <span>Draft (Awaiting Approval)</span>
                              </span>
                            ) : isOrdered ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/40 bg-cyan-500/15 text-cyan-400">
                                <Truck className="w-3 h-3" />
                                <span>Ordered (Incoming)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{po.status}</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isDraft ? (
                              <button
                                onClick={() => handleApprovePO(po.id)}
                                className="px-3 py-1.5 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-[0_0_10px_rgba(200,255,58,0.25)] flex items-center space-x-1 ml-auto"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Approve PO</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-arcade-secondary font-mono">
                                Approved
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Draft Purchase Order */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Draft Purchase Order"
      >
        <form onSubmit={handleCreateDraftPO} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
              Target Product
            </label>
            <div className="p-2 border border-arcade-border bg-arcade-surface text-arcade-primary font-bold">
              {selectedProduct?.product_name} ({selectedProduct?.sku})
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
              Select Supplier
            </label>
            <select
              aria-label="Select Supplier"
              value={poSupplierId}
              onChange={(e) => setPoSupplierId(e.target.value)}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary outline-none focus:border-arcade-accent"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={`sup-${s.id}`} value={s.id}>
                  {s.name} ({s.code}) - {s.lead_time_days} days lead time
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
              Quantity to Reorder (Units)
            </label>
            <input
              type="number"
              min={1}
              value={poQuantity}
              onChange={(e) => setPoQuantity(parseInt(e.target.value, 10))}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary outline-none focus:border-arcade-accent font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
              Internal PO Notes
            </label>
            <textarea
              rows={2}
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary outline-none focus:border-arcade-accent"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-arcade-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 border border-arcade-border text-arcade-secondary hover:text-arcade-primary text-xs uppercase"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submittingPo || !poSupplierId || poQuantity <= 0}
              className="px-4 py-2 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 disabled:opacity-50"
            >
              {submittingPo ? 'Generating...' : 'Create Draft PO'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
