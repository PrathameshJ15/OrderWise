import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  RefreshCw,
  Package,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Calendar,
  Info,
  Database,
  Clock,
  TrendingUp,
  Award,
} from 'lucide-react';
import apiClient from '../../api/client';
import Modal from '../../components/ui/Modal';
import SupplierNetworkVisual from '../../components/3d/SupplierNetworkVisual';

export default function Replenishment() {
  const [recommendations, setRecommendations] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [demandPeriod, setDemandPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [posLoading, setPosLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Active view tab: 'recommendations' | 'purchase_orders' | 'supplier_performance'
  const [activeTab, setActiveTab] = useState('recommendations');

  // Modal State for Draft PO Creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [poQuantity, setPoQuantity] = useState(10);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [submittingPo, setSubmittingPo] = useState(false);

  // Supplier Performance Intelligence State (Phase 18)
  const [supplierPerformance, setSupplierPerformance] = useState(null);
  const [perfLoading, setPerfLoading] = useState(false);

  // Receive Shipment Modal State
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedPoToReceive, setSelectedPoToReceive] = useState(null);
  const [actualDeliveryDate, setActualDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [receivingPo, setReceivingPo] = useState(false);

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

  const fetchSupplierPerformance = async () => {
    setPerfLoading(true);
    try {
      await ensureAuth();
      const res = await apiClient.get('/replenishment/suppliers/performance');
      setSupplierPerformance(res.data?.data || null);
    } catch (err) {
      console.warn('Supplier performance fetch warning:', err);
    } finally {
      setPerfLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(demandPeriod);
    fetchPOs();
    fetchSuppliers();
    fetchSupplierPerformance();
  }, [demandPeriod]);

  const handleReceivePo = async (e) => {
    e.preventDefault();
    if (!selectedPoToReceive) return;
    setReceivingPo(true);
    setError(null);
    try {
      await apiClient.post(`/replenishment/po/${selectedPoToReceive.id}/receive`, {
        actual_delivery_date: actualDeliveryDate,
      });
      setSuccessMsg(`Purchase Order #${selectedPoToReceive.id} received successfully. Stock on-hand and inventory ledger updated.`);
      setReceiveModalOpen(false);
      setSelectedPoToReceive(null);
      await fetchPOs();
      await fetchRecommendations();
      await fetchSupplierPerformance();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to receive purchase order');
    } finally {
      setReceivingPo(false);
    }
  };

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
    <div className="space-y-6 pb-12 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <Truck className="w-3.5 h-3.5" />
            <span>PHASE 11 SUPPLY INTELLIGENCE &amp; REPLENISHMENT</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            Replenishment <span className="text-ac">&amp;</span> Demand Planning
          </h1>
          <p className="text-[14px] text-t2 font-sans max-w-2xl mt-0.5 leading-relaxed">
            Deterministic reorder point calculation factoring confirmed incoming supplier shipments and safe replenishment buffers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 rounded-pill border border-bd bg-s2 px-4 py-2 text-[13px] text-t2">
            <Calendar className="w-4 h-4 text-ac" />
            <span>Demand Window:</span>
            <select
              aria-label="Select Demand Window"
              value={demandPeriod}
              onChange={(e) => setDemandPeriod(parseInt(e.target.value, 10))}
              className="bg-transparent border-none text-t font-mono font-bold outline-none cursor-pointer"
            >
              <option value={14} className="bg-s text-t">14 Days</option>
              <option value={30} className="bg-s text-t">30 Days</option>
              <option value={60} className="bg-s text-t">60 Days</option>
              <option value={90} className="bg-s text-t">90 Days</option>
            </select>
          </div>

          <Link
            to="/admin/inventory"
            className="btn-secondary min-h-[44px] px-4 text-[14px] flex items-center space-x-1.5"
          >
            <Database className="w-4 h-4 text-ac" />
            <span>Inventory Hub &rarr;</span>
          </Link>
          <button
            onClick={() => fetchRecommendations(demandPeriod)}
            disabled={loading}
            className="btn-primary flex items-center space-x-1.5 disabled:opacity-50 shadow-[0_6px_24px_rgba(229,9,20,0.4)]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/40 bg-[#291313] text-no text-[13px] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-card border border-ok/40 bg-[#102416] text-ok text-[13px] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-card border border-bd bg-s">
          <div className="text-[11px] font-mono text-t2 flex items-center justify-between">
            <span>Products Evaluated</span>
            <Package className="w-4 h-4 text-ac" />
          </div>
          <div className="text-2xl font-mono font-bold text-t mt-1">
            {summary.total}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Active catalog items</div>
        </div>

        <div className="p-4 rounded-card border border-wa/40 bg-[#2B2010]">
          <div className="text-[11px] font-mono text-wa flex items-center justify-between">
            <span>Replenish Recommended</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-mono font-bold text-wa mt-1">
            {summary.replenishCount}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Position &le; Reorder Point</div>
        </div>

        <div className="p-4 rounded-card border border-no/40 bg-s">
          <div className="text-[11px] font-mono text-no flex items-center justify-between">
            <span>Critical Shortage Risk</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-mono font-bold text-no mt-1">
            {summary.criticalCount}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Position &le; 0 units</div>
        </div>

        <div className="p-4 rounded-card border border-ok/40 bg-s">
          <div className="text-[11px] font-mono text-ok flex items-center justify-between">
            <span>Confirmed Incoming</span>
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-mono font-bold text-ok mt-1">
            {summary.totalIncoming}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Units on approved POs</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2.5 pb-2 overflow-x-auto touch-scroll flex-nowrap w-full">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-5 py-2.5 rounded-pill text-[13px] font-semibold transition-colors border whitespace-nowrap shrink-0 ${
            activeTab === 'recommendations'
              ? 'border-ac bg-ac text-white'
              : 'border-bd text-t2 hover:text-t bg-s hover:border-white'
          }`}
        >
          Replenishment Recommendations ({recommendations.length})
        </button>

        <button
          onClick={() => setActiveTab('purchase_orders')}
          className={`px-5 py-2.5 rounded-pill text-[13px] font-semibold transition-colors border whitespace-nowrap shrink-0 ${
            activeTab === 'purchase_orders'
              ? 'border-ac bg-ac text-white'
              : 'border-bd text-t2 hover:text-t bg-s hover:border-white'
          }`}
        >
          Purchase Orders &amp; Approvals ({purchaseOrders.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('supplier_performance');
            fetchSupplierPerformance();
          }}
          className={`px-5 py-2.5 rounded-pill text-[13px] font-semibold transition-colors border whitespace-nowrap shrink-0 ${
            activeTab === 'supplier_performance'
              ? 'border-ac bg-ac text-white'
              : 'border-bd text-t2 hover:text-t bg-s hover:border-white'
          }`}
        >
          Supplier Performance Intelligence ({supplierPerformance?.summary?.total_suppliers || suppliers.length || 0})
        </button>
      </div>

      {/* Tab 1: Recommendations Table */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="card-base p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="border-b border-bd bg-s2/60 text-[12px] font-sans font-medium uppercase tracking-wider text-t2">
                    <th className="py-3.5 px-4">Product / SKU</th>
                    <th className="py-3.5 px-4 text-right">On-Hand</th>
                    <th className="py-3.5 px-4 text-right">Reserved</th>
                    <th className="py-3.5 px-4 text-right">Incoming</th>
                    <th className="py-3.5 px-4 text-right font-bold text-t">Inv Position</th>
                    <th className="py-3.5 px-4 text-right">Daily Demand</th>
                    <th className="py-3.5 px-4 text-right">Lead Time</th>
                    <th className="py-3.5 px-4 text-right">Reorder Point</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Suggested Order</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bd/50">
                  {recommendations.map((rec) => {
                    const isNeeded = rec.needs_replenishment;
                    const positionColor =
                      rec.inventory_position <= 0
                        ? 'text-no bg-no/10 border-no/30'
                        : isNeeded
                        ? 'text-wa bg-wa/10 border-wa/30'
                        : 'text-ok bg-ok/10 border-ok/30';

                    return (
                      <React.Fragment key={`rec-${rec.product_id}`}>
                        <tr className="hover:bg-s2/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-t">{rec.product_name}</div>
                            <div className="text-[12px] font-mono text-t2 flex items-center space-x-1.5 mt-0.5">
                              <span className="text-ac">{rec.sku}</span>
                              {rec.supplier && (
                                <>
                                  <span>·</span>
                                  <span>{rec.supplier.name}</span>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-t">
                            {rec.on_hand_quantity}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-series">
                            {rec.reserved_quantity}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-ok">
                            {rec.confirmed_incoming > 0 ? `+${rec.confirmed_incoming}` : '0'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className={`inline-block px-2.5 py-0.5 font-mono font-bold text-[12px] rounded-pill border ${positionColor}`}>
                              {rec.inventory_position}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-t">
                            {rec.average_daily_demand}/d
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-t2">
                            {rec.lead_time_days}d
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-t">
                            {rec.effective_reorder_point}
                            <span className="text-[11px] text-t2 block font-normal">
                              (calc: {rec.calculated_reorder_point})
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isNeeded ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-bold uppercase border border-wa/40 bg-wa/15 text-wa">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Replenish</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold uppercase border border-ok/30 bg-ok/10 text-ok">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Optimal</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-bold text-ac">
                            {isNeeded ? `+${rec.suggested_reorder_quantity} units` : '—'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenDraftModal(rec)}
                              className="btn-header inline-flex items-center space-x-1 px-3 py-1 text-[12px] font-bold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Draft PO</span>
                            </button>
                          </td>
                        </tr>

                        {/* Explicit Limitation / Estimate Banner if Demand History is Insufficient */}
                        {rec.limitation_note && (
                          <tr className="bg-wa/5 border-b border-bd/40">
                            <td colSpan="11" className="py-2.5 px-4 text-[12px] text-wa flex items-center space-x-2">
                              <Info className="w-4 h-4 flex-shrink-0" />
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

          <div className="card-base p-4 text-[13px] text-t2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-ac shrink-0" />
              <span><strong>Estimate Notice:</strong> All demand velocities, safety stock buffers, and reorder levels are estimates modeled from recent historical sales orders.</span>
            </span>
            <span className="font-mono text-ac text-[11px] shrink-0">Human Approval Required</span>
          </div>
        </div>
      )}

      {/* Tab 2: Purchase Orders & Governance Tab */}
      {activeTab === 'purchase_orders' && (
        <div className="space-y-4">
          <div className="card-base p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-t">
                  Purchase Order Governance
                </h3>
                <p className="text-[14px] text-t2 mt-0.5">
                  OrderWise strictly forbids automated purchase execution. Draft purchase orders require explicit administrative review and approval.
                </p>
              </div>

              <span className="px-3 py-1 rounded-pill border border-ac/40 bg-ac/10 text-ac text-[12px] font-mono font-bold flex items-center space-x-1.5 self-start sm:self-auto">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Gatekeeper Active</span>
              </span>
            </div>
          </div>

          <div className="card-base p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="border-b border-bd bg-s2/60 text-[12px] font-mono text-t2">
                    <th className="py-3.5 px-4">PO Number</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Items Ordered</th>
                    <th className="py-3.5 px-4">Expected Delivery</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bd/50">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-t2">
                        {posLoading ? 'Loading purchase orders...' : 'No purchase orders recorded.'}
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => {
                      const isDraft = po.status === 'draft';
                      const isOrdered = po.status === 'ordered';

                      return (
                        <tr key={`po-${po.id}`} className="hover:bg-s2/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-ac">{po.po_number}</span>
                            <span className="text-[12px] font-mono text-t2 block mt-0.5">
                              Created: {new Date(po.created_at).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-t">{po.supplier_name}</div>
                            <div className="text-[12px] font-mono text-t2">{po.supplier_code}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            {po.items?.map((it) => (
                              <div key={`po-item-${it.id}`} className="text-[13px]">
                                <strong className="text-t">{it.quantity_ordered}</strong> × {it.product_name}
                              </div>
                            ))}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-t2 text-[13px]">
                            {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'Pending'}
                          </td>

                          <td className="py-3.5 px-4">
                            {isDraft ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-bold uppercase border border-wa/40 bg-wa/15 text-wa">
                                <span>Draft (Awaiting Approval)</span>
                              </span>
                            ) : isOrdered ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-bold uppercase border border-ok/40 bg-ok/15 text-ok">
                                <Truck className="w-3 h-3" />
                                <span>Ordered (Incoming)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-bold uppercase border border-ok/40 bg-ok/10 text-ok">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{po.status}</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isDraft ? (
                              <button
                                onClick={() => handleApprovePO(po.id)}
                                className="btn-primary inline-flex items-center space-x-1.5 px-4 py-1.5 text-[12px] ml-auto"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Approve PO</span>
                              </button>
                            ) : isOrdered || po.status === 'in_transit' ? (
                              <button
                                onClick={() => {
                                  setSelectedPoToReceive(po);
                                  setActualDeliveryDate(new Date().toISOString().slice(0, 10));
                                  setReceiveModalOpen(true);
                                }}
                                className="px-3.5 py-1.5 rounded-pill bg-ok/20 border border-ok/50 text-ok text-[12px] font-bold hover:bg-ok/30 inline-flex items-center space-x-1.5 ml-auto transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Receive Shipment</span>
                              </button>
                            ) : (
                              <span className="text-[12px] text-ok font-mono font-medium">
                                Received ✓
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

      {/* Tab 3: Supplier Performance Intelligence (Phase 18) */}
      {activeTab === 'supplier_performance' && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="card-base bg-s2/40 border border-bd">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-ac uppercase font-bold tracking-wider">
                  <Award className="w-3.5 h-3.5" />
                  <span>Phase 18 Supplier Reliability &amp; Performance Ledger</span>
                </div>
                <h2 className="text-[20px] font-bold text-t mt-1">
                  Empirical Supplier Delivery Scorecards
                </h2>
                <p className="text-[13px] text-t2 mt-0.5 max-w-3xl leading-relaxed">
                  Real-world fulfillment tracking. On-time delivery rates and lead time drift are computed from
                  actual received purchase orders. Zero-delivery vendors are safeguarded as <code>INSUFFICIENT_DATA</code>.
                </p>
              </div>

              <button
                onClick={fetchSupplierPerformance}
                disabled={perfLoading}
                className="btn-secondary px-4 py-2 text-[13px] flex items-center space-x-1.5 self-start md:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${perfLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Scorecards</span>
              </button>
            </div>
          </div>

          {/* Supplier Performance KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-card border border-bd bg-s">
              <div className="text-[11px] font-mono text-t2 flex items-center justify-between">
                <span>Portfolio On-Time Rate</span>
                <Clock className="w-4 h-4 text-ok" />
              </div>
              <div className="text-2xl font-mono font-bold text-t mt-1">
                {supplierPerformance?.summary?.portfolio_on_time_rate !== null &&
                supplierPerformance?.summary?.portfolio_on_time_rate !== undefined
                  ? `${supplierPerformance.summary.portfolio_on_time_rate}%`
                  : 'N/A'}
              </div>
              <div className="text-[11px] font-mono text-t2 mt-1">
                Across {supplierPerformance?.summary?.total_delivered_pos || 0} completed shipments
              </div>
            </div>

            <div className="p-4 rounded-card border border-bd bg-s">
              <div className="text-[11px] font-mono text-t2 flex items-center justify-between">
                <span>Avg Lead Time Drift</span>
                <TrendingUp className="w-4 h-4 text-ac" />
              </div>
              <div className="text-2xl font-mono font-bold text-t mt-1">
                {supplierPerformance?.summary?.avg_lead_time_variance !== null &&
                supplierPerformance?.summary?.avg_lead_time_variance !== undefined
                  ? `${supplierPerformance.summary.avg_lead_time_variance > 0 ? '+' : ''}${supplierPerformance.summary.avg_lead_time_variance} d`
                  : '0 d'}
              </div>
              <div className="text-[11px] font-mono text-t2 mt-1">
                Actual vs promised delivery days
              </div>
            </div>

            <div className="p-4 rounded-card border border-wa/40 bg-[#2B2010]">
              <div className="text-[11px] font-mono text-wa flex items-center justify-between">
                <span>Active Delayed Shipments</span>
                <AlertTriangle className="w-4 h-4 text-wa" />
              </div>
              <div className="text-2xl font-mono font-bold text-wa mt-1">
                {supplierPerformance?.summary?.delayed_active_orders || 0}
              </div>
              <div className="text-[11px] font-mono text-t2 mt-1">
                Past expected delivery date
              </div>
            </div>

            <div className="p-4 rounded-card border border-bd bg-s">
              <div className="text-[11px] font-mono text-t2 flex items-center justify-between">
                <span>Evaluated Suppliers</span>
                <Truck className="w-4 h-4 text-ac" />
              </div>
              <div className="text-2xl font-mono font-bold text-t mt-1">
                {supplierPerformance?.suppliers?.length || suppliers.length || 0}
              </div>
              <div className="text-[11px] font-mono text-t2 mt-1">
                {supplierPerformance?.summary?.rated_suppliers || 0} rated / {supplierPerformance?.summary?.unrated_suppliers || 0} unrated
              </div>
            </div>
          </div>

          {/* Isometric Supplier Network Visualization */}
          <SupplierNetworkVisual suppliers={supplierPerformance?.suppliers || suppliers} />

          {/* Supplier Scorecards Table */}
          <div className="card-base p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="border-b border-bd bg-s2/60 text-[12px] font-mono text-t2">
                    <th className="py-3.5 px-4">Supplier &amp; Code</th>
                    <th className="py-3.5 px-4 text-center">Deliveries</th>
                    <th className="py-3.5 px-4 text-center">On-Time Rate</th>
                    <th className="py-3.5 px-4 text-right">Promised Lead</th>
                    <th className="py-3.5 px-4 text-right">Actual Lead</th>
                    <th className="py-3.5 px-4 text-right">Lead Variance</th>
                    <th className="py-3.5 px-4 text-center">Active / Delayed</th>
                    <th className="py-3.5 px-4 text-center">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bd/50">
                  {(!supplierPerformance?.suppliers || supplierPerformance.suppliers.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-t2">
                        {perfLoading ? 'Analyzing supplier performance records...' : 'No supplier performance records available.'}
                      </td>
                    </tr>
                  ) : (
                    supplierPerformance.suppliers.map((sup) => {
                      const isUnrated = sup.performance_rating === 'INSUFFICIENT_DATA';
                      const onTime = sup.on_time_delivery_rate;

                      let rateColor = 'text-t2';
                      if (!isUnrated && onTime !== null) {
                        if (onTime >= 85) rateColor = 'text-ok font-bold';
                        else if (onTime >= 70) rateColor = 'text-wa font-bold';
                        else rateColor = 'text-no font-bold';
                      }

                      return (
                        <tr key={`sup-score-${sup.supplier_id}`} className="hover:bg-s2/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-t">{sup.supplier_name}</div>
                            <div className="text-[12px] font-mono text-t2">
                              {sup.supplier_code} {sup.contact_email ? `• ${sup.contact_email}` : ''}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono">
                            <span className="text-t font-bold">{sup.completed_deliveries_count}</span>
                            <span className="text-t2 text-[12px]"> completed</span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono">
                            {isUnrated ? (
                              <span className="inline-block px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase border border-bd bg-s2 text-t2">
                                UNRATED
                              </span>
                            ) : (
                              <span className={`text-[14px] ${rateColor}`}>
                                {onTime}%
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-t2 text-[13px]">
                            {sup.promised_lead_time_days} days
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-t text-[13px]">
                            {sup.actual_avg_lead_time_days !== null
                              ? `${sup.actual_avg_lead_time_days} days`
                              : <span className="text-t2">—</span>}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-[13px]">
                            {sup.lead_time_variance_days !== null ? (
                              <span className={sup.lead_time_variance_days > 0 ? 'text-no' : 'text-ok'}>
                                {sup.lead_time_variance_days > 0 ? `+${sup.lead_time_variance_days} d late` : `${sup.lead_time_variance_days} d early`}
                              </span>
                            ) : (
                              <span className="text-t2 font-sans text-[12px]">No data</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono text-[13px]">
                            <span className="text-t">{sup.active_pos_count} active</span>
                            {sup.delayed_pos_count > 0 && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded-pill text-[10px] bg-no/20 text-no border border-no/40 font-bold">
                                {sup.delayed_pos_count} delayed
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {sup.performance_rating === 'EXCELLENT' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-bold uppercase border border-ok/40 bg-ok/15 text-ok">
                                <Award className="w-3 h-3" />
                                <span>EXCELLENT</span>
                              </span>
                            )}
                            {sup.performance_rating === 'ACCEPTABLE' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-bold uppercase border border-wa/40 bg-wa/15 text-wa">
                                <span>ACCEPTABLE</span>
                              </span>
                            )}
                            {sup.performance_rating === 'AT_RISK' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-bold uppercase border border-no/40 bg-no/15 text-no">
                                <AlertTriangle className="w-3 h-3" />
                                <span>AT RISK</span>
                              </span>
                            )}
                            {sup.performance_rating === 'INSUFFICIENT_DATA' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-bold uppercase border border-bd bg-s2 text-t2" title="Zero completed deliveries on record">
                                <Info className="w-3 h-3" />
                                <span>NO DELIVERIES</span>
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

          {/* Audit Notice */}
          <div className="p-4 rounded-card border border-bd bg-s flex items-start space-x-3 text-[12px] text-t2 font-sans">
            <Info className="w-4 h-4 text-ac flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-t">Deterministic Non-Fabrication Guarantee:</strong> OrderWise never extrapolates or hallucinates supplier performance scores when deliveries are zero. Suppliers with zero historical shipments remain strictly tagged as <code className="text-t">INSUFFICIENT_DATA</code> with unrated reliability until physical goods receipt is confirmed.
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
        <form onSubmit={handleCreateDraftPO} className="space-y-4 text-[14px]">
          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Target Product
            </label>
            <div className="p-3 rounded-card border border-bd bg-s2 text-t font-bold">
              {selectedProduct?.product_name} ({selectedProduct?.sku})
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Select Supplier
            </label>
            <select
              aria-label="Select Supplier"
              value={poSupplierId}
              onChange={(e) => setPoSupplierId(e.target.value)}
              className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t outline-none focus:border-ac text-[14px]"
              required
            >
              <option value="" className="bg-s text-t">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={`sup-${s.id}`} value={s.id} className="bg-s text-t">
                  {s.name} ({s.code}) - {s.lead_time_days} days lead time
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Quantity to Reorder (Units)
            </label>
            <input
              type="number"
              min={1}
              value={poQuantity}
              onChange={(e) => setPoQuantity(parseInt(e.target.value, 10))}
              className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t outline-none focus:border-ac font-mono font-bold text-[14px]"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Internal PO Notes
            </label>
            <textarea
              rows={2}
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
              className="w-full bg-s2 rounded-card border border-bd p-3 text-t outline-none focus:border-ac text-[14px]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-bd">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-header px-5 py-2 text-[14px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submittingPo || !poSupplierId || poQuantity <= 0}
              className="btn-primary px-6 py-2 text-[14px] disabled:opacity-50"
            >
              {submittingPo ? 'Generating...' : 'Create Draft PO'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Purchase Order Receipt (Phase 18) */}
      <Modal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        title="Record Purchase Order Receipt"
      >
        <form onSubmit={handleReceivePo} className="space-y-4 text-[14px]">
          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Receiving Purchase Order
            </label>
            <div className="p-3 rounded-card border border-bd bg-s2 text-t font-mono">
              <div className="font-bold text-[15px]">PO #{selectedPoToReceive?.id}</div>
              <div className="text-[12px] text-t2 mt-0.5">Supplier: {selectedPoToReceive?.supplier_name} ({selectedPoToReceive?.supplier_code})</div>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Incoming Line Items
            </label>
            <div className="p-3 rounded-card border border-bd bg-s2/40 space-y-1.5">
              {selectedPoToReceive?.items?.map((it) => (
                <div key={`rec-item-${it.id}`} className="flex justify-between items-center text-[13px]">
                  <span className="text-t font-medium">{it.product_name}</span>
                  <span className="font-mono text-ok font-bold">+{it.quantity_ordered} units</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-mono text-t2 mb-1.5">
                Promised Delivery
              </label>
              <div className="p-2.5 rounded-pill border border-bd bg-s font-mono text-t2 text-[13px]">
                {selectedPoToReceive?.expected_delivery_date
                  ? new Date(selectedPoToReceive.expected_delivery_date).toLocaleDateString()
                  : 'Pending'}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-mono text-t2 mb-1.5">
                Actual Receipt Date
              </label>
              <input
                type="date"
                value={actualDeliveryDate}
                onChange={(e) => setActualDeliveryDate(e.target.value)}
                className="w-full bg-s2 rounded-pill border border-bd px-3 py-2 text-t outline-none focus:border-ac font-mono text-[13px]"
                required
              />
            </div>
          </div>

          {selectedPoToReceive?.expected_delivery_date && actualDeliveryDate && (
            <div className={`p-3 rounded-card border text-[12px] font-mono flex items-center space-x-2 ${
              new Date(actualDeliveryDate) <= new Date(selectedPoToReceive.expected_delivery_date)
                ? 'border-ok/40 bg-ok/10 text-ok'
                : 'border-no/40 bg-no/10 text-no'
            }`}>
              {new Date(actualDeliveryDate) <= new Date(selectedPoToReceive.expected_delivery_date) ? (
                <>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>On-Time Delivery Recorded (Compliant with SLA)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Late Delivery Recorded (Lead time variance logged against supplier)</span>
                </>
              )}
            </div>
          )}

          <div className="text-[11px] text-t2 leading-relaxed">
            * Receiving this order will mark status as <code className="text-t">received</code>, increment on-hand inventory immediately, and append an audit receipt movement in the inventory ledger.
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-bd">
            <button
              type="button"
              onClick={() => setReceiveModalOpen(false)}
              className="btn-header px-5 py-2 text-[14px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={receivingPo || !actualDeliveryDate}
              className="btn-primary px-6 py-2 text-[14px] disabled:opacity-50"
            >
              {receivingPo ? 'Recording...' : 'Confirm Receipt & Update Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
