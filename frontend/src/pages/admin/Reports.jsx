import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Percent,
  AlertOctagon,
  DollarSign,
  Cpu,
  RefreshCw,
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
    <div className="space-y-6 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <FileText className="h-3.5 w-3.5" />
            <span>Operational Reports &amp; Exports Hub</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            Supply Chain &amp; Allocation Analytics
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5 max-w-2xl">
            Audit-ready evidence: deterministic fill rates, deferred demand root causes, inventory valuation, and governance metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/allocation"
            className="btn-secondary min-h-[44px] px-4 text-[14px] flex items-center space-x-1.5"
          >
            <Cpu className="h-4 w-4 text-ac" />
            <span>Allocation Center</span>
          </Link>
          <Link
            to="/admin/inventory"
            className="btn-secondary min-h-[44px] px-4 text-[14px] flex items-center space-x-1.5"
          >
            <Database className="h-4 w-4 text-ac" />
            <span>Inventory Hub</span>
          </Link>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 shadow-[0_0_20px_rgba(229,9,20,0.35)]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/40 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline hover:text-t text-[12px]">
            Dismiss
          </button>
        </div>
      )}

      {/* CSV Export Bar */}
      <div className="card-base p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Download className="h-4 w-4 text-ac" />
          <span className="text-[14px] font-bold text-t">
            Export On-Screen Datasets (CSV)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCSV('orders')}
            disabled={exportingType !== null}
            className="btn-secondary px-4 py-2 text-[13px] font-sans font-medium disabled:opacity-50"
          >
            <span>Orders CSV</span>
          </button>
          <button
            onClick={() => handleExportCSV('allocation_runs')}
            disabled={exportingType !== null}
            className="btn-secondary px-4 py-2 text-[13px] font-sans font-medium disabled:opacity-50"
          >
            <span>Allocation Runs CSV</span>
          </button>
          <button
            onClick={() => handleExportCSV('inventory_movements')}
            disabled={exportingType !== null}
            className="btn-secondary px-4 py-2 text-[13px] font-sans font-medium disabled:opacity-50"
          >
            <span>Inventory Movements CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center justify-between text-t2 text-[12px] font-mono mb-2">
            <span>Order Fill Rate</span>
            <Percent className="h-4 w-4 text-ok" />
          </div>
          <div className="text-3xl font-bold font-mono text-t">
            {kpis.fill_rate_percent}%
          </div>
          <div className="text-[12px] text-t2 mt-1">
            {kpis.fulfilled_orders} of {kpis.total_orders} orders fulfilled
          </div>
        </div>

        <div className="p-5 rounded-card border border-no/40 bg-[#291313]">
          <div className="flex items-center justify-between text-no text-[12px] font-mono mb-2">
            <span>Deferred Demand</span>
            <AlertOctagon className="h-4 w-4 text-no" />
          </div>
          <div className="text-3xl font-bold font-mono text-no">
            {kpis.deferred_orders}
          </div>
          <div className="text-[12px] text-t2 mt-1">
            Orders constrained by stock
          </div>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center justify-between text-t2 text-[12px] font-mono mb-2">
            <span>Inventory Valuation</span>
            <DollarSign className="h-4 w-4 text-ac" />
          </div>
          <div className="text-3xl font-bold font-mono text-t">
            ${(kpis.inventory_valuation_usd || 0).toLocaleString()}
          </div>
          <div className="text-[12px] text-t2 mt-1">
            Physical on-hand asset value
          </div>
        </div>

        <div className="card-base p-5">
          <div className="flex items-center justify-between text-t2 text-[12px] font-mono mb-2">
            <span>AI Governance</span>
            <Cpu className="h-4 w-4 text-wa" />
          </div>
          <div className="text-3xl font-bold font-mono text-t">
            {kpis.ai_approval_rate_percent}%
          </div>
          <div className="text-[12px] text-t2 mt-1">
            Human approval agreement rate
          </div>
        </div>
      </div>

      {/* Two Column Section: Deferred Orders & Inventory Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deferred Demand Breakdown */}
        <div className="card-base space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-bd">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="h-4 w-4 text-no" />
              <h2 className="text-base font-bold text-t">
                Deferred Orders &amp; Bottlenecks
              </h2>
            </div>
            <span className="text-[11px] font-mono text-t2">
              Root Causes
            </span>
          </div>

          <div className="space-y-3">
            {deferredOrders.length === 0 ? (
              <div className="p-6 text-center text-[14px] text-t2 rounded-card border border-bd/40">
                No orders deferred in current allocation run.
              </div>
            ) : (
              deferredOrders.map((d, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-card border border-bd bg-s2 space-y-1"
                >
                  <div className="flex items-center justify-between text-[14px] font-bold text-t mb-1">
                    <span>Order #{d.order_id} • {d.customer_name}</span>
                    <span className="text-no text-[11px] font-mono px-2 py-0.5 rounded-pill border border-no/40 bg-no/10">
                      Deferred
                    </span>
                  </div>
                  <div className="text-[13px] text-t2">
                    Requested: <span className="text-t font-medium">{d.requested_quantity} units</span> of {d.product_name}
                  </div>
                  <div className="text-[12px] text-no/90 pt-1">
                    Cause: {d.reason}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inventory Valuation Breakdown */}
        <div className="card-base space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-bd">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-ac" />
              <h2 className="text-base font-bold text-t">
                Inventory Valuation by SKU
              </h2>
            </div>
            <span className="text-[11px] font-mono text-t2">
              Asset Position
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[14px] text-left">
              <thead>
                <tr className="border-b border-bd text-t2 text-[12px] font-sans font-medium uppercase tracking-wider">
                  <th className="pb-3">SKU / Product</th>
                  <th className="pb-3 text-right">On-Hand</th>
                  <th className="pb-3 text-right">Unit Est.</th>
                  <th className="pb-3 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bd/40">
                {valuationProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-s2/40 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-t">{p.sku}</div>
                      <div className="text-[12px] text-t2 truncate max-w-[180px]">
                        {p.product_name}
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-t">
                      {p.on_hand_quantity}
                    </td>
                    <td className="py-3 text-right font-mono text-t2">
                      ${p.unit_cost || 100}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-ok">
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
