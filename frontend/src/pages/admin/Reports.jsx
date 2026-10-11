import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  TrendingUp,
  Percent,
  AlertOctagon,
  DollarSign,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

export default function Reports() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingType, setExportingType] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/reports/summary');
      setData(res.data);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to generate operational report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = async (type) => {
    setExportingType(type);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
      const url = `${baseUrl}/reports/export/${type}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Export download failed.');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `orderwise_${type}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(err.message || 'Export failed.');
    } finally {
      setExportingType(null);
    }
  };

  const kpis = data?.kpis || {
    total_runs: 1,
    total_orders: 5,
    fulfilled_orders: 2,
    deferred_orders: 2,
    fill_rate_percent: 40,
    inventory_valuation_usd: 68000,
    ai_recommendations_count: 5,
    ai_approval_rate_percent: 80,
  };

  const valuationProducts = data?.inventory_valuation_by_product || [];
  const deferredOrders = data?.deferred_breakdown || [];

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header Banner */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <FileText className="h-3 w-3" />
            <span>Phase 13 • Operational Reports &amp; Exports Hub</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Supply Chain &amp; Allocation Analytics
          </h1>
          <p className="text-xs text-arcade-secondary mt-1 max-w-2xl">
            Audit-ready evidence: deterministic fill rates, deferred demand root causes, inventory valuation, and governance metrics.
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3 py-2 border border-arcade-border bg-arcade-surface hover:border-arcade-accent text-arcade-primary text-xs uppercase tracking-wider font-bold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* CSV Export Bar */}
      <div className="border border-arcade-border bg-arcade-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Download className="h-4 w-4 text-arcade-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-arcade-primary">
            Export On-Screen Datasets (CSV)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCSV('orders')}
            disabled={exportingType !== null}
            className="px-3 py-1.5 border border-arcade-border bg-arcade-neutral hover:border-arcade-accent text-arcade-primary text-xs uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1.5"
          >
            <span>Orders CSV</span>
          </button>
          <button
            onClick={() => handleExportCSV('allocation_runs')}
            disabled={exportingType !== null}
            className="px-3 py-1.5 border border-arcade-border bg-arcade-neutral hover:border-arcade-accent text-arcade-primary text-xs uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1.5"
          >
            <span>Allocation Runs CSV</span>
          </button>
          <button
            onClick={() => handleExportCSV('inventory_movements')}
            disabled={exportingType !== null}
            className="px-3 py-1.5 border border-arcade-border bg-arcade-neutral hover:border-arcade-accent text-arcade-primary text-xs uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 flex items-center space-x-1.5"
          >
            <span>Inventory Movements CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary text-xs uppercase mb-2">
            <span>Order Fill Rate</span>
            <Percent className="h-4 w-4 text-arcade-accent" />
          </div>
          <div className="font-display text-3xl font-extrabold text-arcade-primary">
            {kpis.fill_rate_percent}%
          </div>
          <div className="text-[11px] text-arcade-secondary mt-1">
            {kpis.fulfilled_orders} of {kpis.total_orders} orders fulfilled
          </div>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary text-xs uppercase mb-2">
            <span>Deferred Demand</span>
            <AlertOctagon className="h-4 w-4 text-arcade-danger" />
          </div>
          <div className="font-display text-3xl font-extrabold text-arcade-danger">
            {kpis.deferred_orders}
          </div>
          <div className="text-[11px] text-arcade-secondary mt-1">
            Orders constrained by stock
          </div>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary text-xs uppercase mb-2">
            <span>Inventory Valuation</span>
            <DollarSign className="h-4 w-4 text-arcade-info" />
          </div>
          <div className="font-display text-3xl font-extrabold text-arcade-primary">
            ${(kpis.inventory_valuation_usd || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-arcade-secondary mt-1">
            Physical on-hand asset value
          </div>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary text-xs uppercase mb-2">
            <span>AI Governance</span>
            <Cpu className="h-4 w-4 text-arcade-warning" />
          </div>
          <div className="font-display text-3xl font-extrabold text-arcade-primary">
            {kpis.ai_approval_rate_percent}%
          </div>
          <div className="text-[11px] text-arcade-secondary mt-1">
            Human approval agreement rate
          </div>
        </div>
      </div>

      {/* Two Column Section: Deferred Orders & Inventory Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deferred Demand Breakdown */}
        <div className="border border-arcade-border bg-arcade-neutral p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-arcade-border">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="h-4 w-4 text-arcade-danger" />
              <h2 className="font-display text-lg font-bold uppercase text-arcade-primary">
                Deferred Orders &amp; Bottlenecks
              </h2>
            </div>
            <span className="text-[10px] text-arcade-secondary uppercase tracking-widest">
              Root Causes
            </span>
          </div>

          <div className="space-y-3">
            {deferredOrders.length === 0 ? (
              <div className="p-4 text-center text-xs text-arcade-secondary border border-arcade-border/50">
                No orders deferred in current allocation run.
              </div>
            ) : (
              deferredOrders.map((d, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-arcade-border bg-arcade-surface hover:border-arcade-danger/60 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-arcade-primary mb-1">
                    <span>Order #{d.order_id} • {d.customer_name}</span>
                    <span className="text-arcade-danger text-[10px] uppercase px-1.5 py-0.5 border border-arcade-danger/40 bg-arcade-danger/10">
                      Deferred
                    </span>
                  </div>
                  <div className="text-xs text-arcade-secondary mb-1">
                    Requested: <span className="text-arcade-primary font-semibold">{d.requested_quantity} units</span> of {d.product_name}
                  </div>
                  <div className="text-[11px] text-arcade-danger/90 leading-snug">
                    Cause: {d.reason}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inventory Valuation Breakdown */}
        <div className="border border-arcade-border bg-arcade-neutral p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-arcade-border">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-arcade-info" />
              <h2 className="font-display text-lg font-bold uppercase text-arcade-primary">
                Inventory Valuation by SKU
              </h2>
            </div>
            <span className="text-[10px] text-arcade-secondary uppercase tracking-widest">
              Asset Position
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-arcade-border text-arcade-secondary uppercase text-[10px]">
                  <th className="pb-2">SKU / Product</th>
                  <th className="pb-2 text-right">On-Hand</th>
                  <th className="pb-2 text-right">Unit Est.</th>
                  <th className="pb-2 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arcade-border/40">
                {valuationProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-arcade-surface/50">
                    <td className="py-2.5">
                      <div className="font-bold text-arcade-primary">{p.sku}</div>
                      <div className="text-[10px] text-arcade-secondary truncate max-w-[180px]">
                        {p.product_name}
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono text-arcade-primary">
                      {p.on_hand_quantity}
                    </td>
                    <td className="py-2.5 text-right text-arcade-secondary">
                      ${p.unit_cost || 100}
                    </td>
                    <td className="py-2.5 text-right font-bold text-arcade-accent">
                      ${(p.total_value || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
