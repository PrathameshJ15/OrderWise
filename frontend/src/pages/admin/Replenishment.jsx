import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  RefreshCw,
  Search,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import apiClient from '../../api/client';

export default function Replenishment() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'reorder' | 'critical'
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchReplenishment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/replenishment');
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to load replenishment telemetry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReplenishment();
  }, [fetchReplenishment]);

  const filteredRecs = recommendations.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sku.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'reorder') {
      return r.flag === 'REORDER_RECOMMENDED';
    }
    if (filterMode === 'critical') {
      return r.estimated_shortage_risk === 'critical' || r.estimated_shortage_risk === 'high';
    }
    return true;
  });

  const reorderCount = recommendations.filter((r) => r.flag === 'REORDER_RECOMMENDED').length;
  const criticalCount = recommendations.filter(
    (r) => r.estimated_shortage_risk === 'critical' || r.estimated_shortage_risk === 'high'
  ).length;
  const totalSuggestedUnits = recommendations.reduce(
    (sum, r) => sum + (r.suggested_reorder_quantity || 0),
    0
  );

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <Truck className="h-3 w-3" />
            <span>SUPPLY CHAIN PREDICTIVE ADVISOR</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Replenishment Advisor
          </h1>
          <p className="text-xs text-arcade-secondary mt-1 max-w-3xl">
            Calculates algorithmic reorder points <code className="text-arcade-accent">Rp = (Demand × LeadTime) + Safety</code> and net inventory positions <code className="text-arcade-accent">Ipos = OnHand + Incoming - Reserved</code> to proactively prevent stockouts.
          </p>
        </div>

        <button
          onClick={fetchReplenishment}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 border border-arcade-border bg-arcade-surface hover:border-arcade-accent text-xs uppercase tracking-wider transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {error && (
        <div className="p-4 border border-arcade-danger/40 bg-arcade-danger/10 text-arcade-danger text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary mb-1">
            <span className="text-[11px] uppercase tracking-wider">Tracked Catalog</span>
            <Package className="h-4 w-4 text-arcade-accent" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-primary">
            {recommendations.length}
          </div>
          <span className="text-[10px] text-arcade-secondary">Active SKUs evaluated</span>
        </div>

        <div className="border border-arcade-warning/30 bg-arcade-warning/5 p-4">
          <div className="flex items-center justify-between text-arcade-warning mb-1">
            <span className="text-[11px] uppercase tracking-wider">Reorder Needed</span>
            <AlertTriangle className="h-4 w-4 text-arcade-warning" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-warning">
            {reorderCount}
          </div>
          <span className="text-[10px] text-arcade-warning/80">Position &le; Reorder Point</span>
        </div>

        <div className="border border-arcade-danger/30 bg-arcade-danger/5 p-4">
          <div className="flex items-center justify-between text-arcade-danger mb-1">
            <span className="text-[11px] uppercase tracking-wider">High/Critical Risk</span>
            <ShieldAlert className="h-4 w-4 text-arcade-danger" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-danger">
            {criticalCount}
          </div>
          <span className="text-[10px] text-arcade-danger/80">Exhaustion threat</span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary mb-1">
            <span className="text-[11px] uppercase tracking-wider">Suggested Units</span>
            <TrendingUp className="h-4 w-4 text-arcade-accent" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-accent">
            {totalSuggestedUnits}
          </div>
          <span className="text-[10px] text-arcade-secondary">Cumulative order volume</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="border border-arcade-border bg-arcade-neutral p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center space-x-1 border border-arcade-border bg-arcade-surface p-1">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
              filterMode === 'all'
                ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                : 'text-arcade-secondary hover:text-arcade-primary'
            }`}
          >
            All Products ({recommendations.length})
          </button>
          <button
            onClick={() => setFilterMode('reorder')}
            className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
              filterMode === 'reorder'
                ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                : 'text-arcade-secondary hover:text-arcade-primary'
            }`}
          >
            Reorder Recommended ({reorderCount})
          </button>
          <button
            onClick={() => setFilterMode('critical')}
            className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
              filterMode === 'critical'
                ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                : 'text-arcade-secondary hover:text-arcade-primary'
            }`}
          >
            Critical & High Risk ({criticalCount})
          </button>
        </div>

        <div className="flex items-center space-x-2 border border-arcade-border bg-arcade-surface px-2.5 py-1 text-xs w-full md:w-64">
          <Search className="h-3.5 w-3.5 text-arcade-secondary" />
          <input
            type="text"
            placeholder="Filter by product or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-arcade-primary focus:outline-none text-xs w-full placeholder-arcade-secondary/60"
          />
        </div>
      </div>

      {/* Replenishment Table */}
      {loading ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-arcade-accent" />
          <span className="text-xs tracking-wider uppercase">Computing replenishment models...</span>
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex flex-col items-center justify-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-arcade-accent/80" />
          <h3 className="font-display text-base uppercase text-arcade-primary font-bold">
            No SKUs Match Filter
          </h3>
          <p className="text-xs text-arcade-secondary">
            Try adjusting your search query or switching to view all catalog products.
          </p>
        </div>
      ) : (
        <div className="border border-arcade-border bg-arcade-neutral overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arcade-border bg-arcade-surface/60 text-arcade-secondary uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-3 text-right">Physical On-Hand</th>
                <th className="py-3 px-3 text-right">Reserved</th>
                <th className="py-3 px-3 text-right">Incoming PO</th>
                <th className="py-3 px-3 text-right">Net Position (Ipos)</th>
                <th className="py-3 px-3 text-right">Reorder Point (Rp)</th>
                <th className="py-3 px-3 text-center">Velocity & Lead</th>
                <th className="py-3 px-3 text-center">Shortage Risk</th>
                <th className="py-3 px-3 text-right">Suggested Reorder</th>
                <th className="py-3 px-4 text-center">Status Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arcade-border/50">
              {filteredRecs.map((rec) => {
                const isReorder = rec.flag === 'REORDER_RECOMMENDED';
                const isCriticalRisk = rec.estimated_shortage_risk === 'critical';
                const isHighRisk = rec.estimated_shortage_risk === 'high';

                return (
                  <tr
                    key={rec.product_id}
                    onClick={() => setSelectedProduct(rec)}
                    className="hover:bg-arcade-surface/50 cursor-pointer transition-colors group"
                  >
                    {/* SKU & Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors">
                        {rec.product_name}
                      </div>
                      <div className="text-[10px] text-arcade-secondary flex items-center space-x-1.5 mt-0.5">
                        <span className="text-arcade-accent">{rec.sku}</span>
                        <span>•</span>
                        <span>Unit: {rec.unit}</span>
                      </div>
                    </td>

                    {/* On Hand */}
                    <td className="py-3.5 px-3 text-right font-semibold text-arcade-primary">
                      {rec.current_stock}
                    </td>

                    {/* Reserved */}
                    <td className="py-3.5 px-3 text-right text-arcade-secondary">
                      {rec.reserved_quantity}
                    </td>

                    {/* Incoming */}
                    <td className="py-3.5 px-3 text-right">
                      {rec.incoming_stock > 0 ? (
                        <span className="text-arcade-accent font-semibold">
                          +{rec.incoming_stock}
                        </span>
                      ) : (
                        <span className="text-arcade-secondary">0</span>
                      )}
                    </td>

                    {/* Net Inventory Position */}
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`font-bold ${
                          rec.inventory_position <= 0
                            ? 'text-arcade-danger'
                            : rec.inventory_position <= rec.safety_stock
                            ? 'text-arcade-warning'
                            : 'text-arcade-primary'
                        }`}
                      >
                        {rec.inventory_position}
                      </span>
                    </td>

                    {/* Reorder Point */}
                    <td className="py-3.5 px-3 text-right font-mono text-arcade-secondary">
                      {rec.reorder_point}
                    </td>

                    {/* Demand & Lead */}
                    <td className="py-3.5 px-3 text-center text-[10px] text-arcade-secondary">
                      <div>{rec.average_daily_demand} / day</div>
                      <div className="flex items-center justify-center space-x-1 text-[9px] text-arcade-secondary/80">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{rec.supplier_lead_time_days}d lead</span>
                      </div>
                    </td>

                    {/* Shortage Risk */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 font-bold border tracking-wider inline-block ${
                          isCriticalRisk
                            ? 'bg-arcade-danger/20 text-arcade-danger border-arcade-danger/40'
                            : isHighRisk
                            ? 'bg-arcade-warning/20 text-arcade-warning border-arcade-warning/40'
                            : rec.estimated_shortage_risk === 'medium'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                            : 'bg-arcade-surface text-arcade-secondary border-arcade-border'
                        }`}
                      >
                        {rec.estimated_shortage_risk}
                      </span>
                    </td>

                    {/* Suggested Reorder Qty */}
                    <td className="py-3.5 px-3 text-right">
                      {rec.suggested_reorder_quantity > 0 ? (
                        <span className="font-bold text-arcade-accent">
                          {rec.suggested_reorder_quantity} {rec.unit}
                        </span>
                      ) : (
                        <span className="text-arcade-secondary">—</span>
                      )}
                    </td>

                    {/* Status Flag */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[9px] uppercase px-2 py-1 font-extrabold border tracking-wider inline-flex items-center space-x-1 ${
                          isReorder
                            ? 'bg-arcade-accent text-arcade-surface border-arcade-accent shadow-[0_0_8px_rgba(200,255,58,0.3)]'
                            : 'bg-arcade-surface text-arcade-secondary border-arcade-border'
                        }`}
                      >
                        {isReorder ? (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            <span>REORDER RECOMMENDED</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-arcade-accent" />
                            <span>ADEQUATE STOCK</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Formula Explanation Callout Drawer */}
      {selectedProduct && (
        <div className="border border-arcade-accent/40 bg-arcade-neutral p-5 space-y-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-arcade-accent" />
              <h3 className="font-display text-sm uppercase font-bold text-arcade-primary">
                Mathematical Model Breakdown: {selectedProduct.product_name} ({selectedProduct.sku})
              </h3>
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="text-xs text-arcade-secondary hover:text-arcade-primary underline"
            >
              Close Breakdown
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-arcade-surface border border-arcade-border space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-arcade-accent tracking-wider block">
                1. Reorder Point (Rp)
              </span>
              <p className="text-arcade-secondary">
                <code className="text-arcade-primary">
                  ({selectedProduct.average_daily_demand} units/day × {selectedProduct.supplier_lead_time_days} days) + {selectedProduct.safety_stock} safety = {selectedProduct.reorder_point} units
                </code>
              </p>
              <p className="text-[11px] text-arcade-secondary/80">
                Minimum buffer required to sustain continuous order flow during replenishment lead times.
              </p>
            </div>

            <div className="p-3 bg-arcade-surface border border-arcade-border space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-arcade-accent tracking-wider block">
                2. Inventory Position (Ipos)
              </span>
              <p className="text-arcade-secondary">
                <code className="text-arcade-primary">
                  {selectedProduct.current_stock} on-hand + {selectedProduct.incoming_stock} incoming - {selectedProduct.reserved_quantity} reserved = {selectedProduct.inventory_position} net units
                </code>
              </p>
              <p className="text-[11px] text-arcade-secondary/80">
                True unencumbered stock position factoring in pending commitments and active purchase orders.
              </p>
            </div>
          </div>

          <div className="p-3 bg-arcade-surface/60 border border-arcade-border text-xs flex items-start space-x-2">
            <ArrowRight className="h-4 w-4 text-arcade-accent mt-0.5 shrink-0" />
            <div>
              <span className="text-arcade-primary font-bold">Calculation Summary: </span>
              <span className="text-arcade-secondary">{selectedProduct.formula_used}</span>
            </div>
          </div>
        </div>
      )}

      {/* Governance & Disclaimer Notice */}
      <div className="p-4 border border-arcade-border bg-arcade-neutral text-[11px] text-arcade-secondary flex items-start space-x-3">
        <Layers className="h-4 w-4 text-arcade-accent mt-0.5 shrink-0" />
        <div>
          <span className="font-bold text-arcade-primary uppercase tracking-wider block mb-0.5">
            Governed Supply Chain Intelligence Rule
          </span>
          <p>
            All replenishment reorder suggestions are algorithmic estimates derived from current demand velocity and supplier contract terms. OrderWise does not auto-create purchase orders. Authorized procurement personnel must review before issuing binding supplier orders.
          </p>
        </div>
      </div>
    </div>
  );
}
