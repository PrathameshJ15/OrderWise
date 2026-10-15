import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  BarChart2,
  AlertCircle,
  Clock,
  User,
  Package,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import apiClient from '../../api/client';
import { ImpactBadge, CauseAttributionBadge } from '../../components/allocation/ImpactBadge';
import { StatusPill } from '../../components/ui/StatusPill';

export default function ImpactAnalyzer() {
  const [runs, setRuns] = useState([]);
  const [selectedBaseRun, setSelectedBaseRun] = useState('');
  const [selectedTargetRun, setSelectedTargetRun] = useState('');
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [filterClass, setFilterClass] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-login admin for demo session
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

  // Fetch available completed runs
  const fetchRuns = async () => {
    try {
      await ensureAdminAuth();
      const res = await apiClient.get('/impact/runs');
      const fetchedRuns = res.data?.runs || [];
      setRuns(fetchedRuns);
      return fetchedRuns;
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to fetch allocation runs');
      return [];
    }
  };

  // Fetch impact comparison
  const fetchComparison = async (baseId = null, targetId = null) => {
    setComparing(true);
    setError(null);
    try {
      await ensureAdminAuth();
      let url = '/impact/compare';
      if (baseId && targetId) {
        url = `/impact/compare?baseRun=${baseId}&targetRun=${targetId}`;
      }
      const res = await apiClient.get(url);
      setImpactData(res.data);
      if (res.data?.base_run?.id) setSelectedBaseRun(res.data.base_run.id.toString());
      if (res.data?.target_run?.id) setSelectedTargetRun(res.data.target_run.id.toString());
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to calculate allocation impact');
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      const fetchedRuns = await fetchRuns();
      if (fetchedRuns.length >= 2) {
        // Defaults to target = latest (index 0), base = previous (index 1)
        await fetchComparison(fetchedRuns[1].id, fetchedRuns[0].id);
      } else {
        await fetchComparison();
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleRunSelect = (e) => {
    e.preventDefault();
    if (selectedBaseRun && selectedTargetRun) {
      fetchComparison(selectedBaseRun, selectedTargetRun);
    }
  };

  const handleCompareLatest = async () => {
    if (runs.length >= 2) {
      setSelectedBaseRun(runs[1].id.toString());
      setSelectedTargetRun(runs[0].id.toString());
      await fetchComparison(runs[1].id, runs[0].id);
    } else {
      await fetchComparison();
    }
  };

  // Filtered change items
  const filteredChanges = useMemo(() => {
    if (!impactData?.changes) return [];

    return impactData.changes.filter((item) => {
      // Classification filter
      if (filterClass !== 'ALL') {
        if (filterClass === 'IMPROVEMENTS') {
          if (item.classification !== 'IMPROVED' && item.classification !== 'NEWLY_FULFILLED') return false;
        } else if (filterClass === 'DEGRADATIONS') {
          if (item.classification !== 'DEGRADED' && item.classification !== 'NEWLY_DEFERRED') return false;
        } else if (filterClass === 'CHANGED_ONLY') {
          if (!item.changed) return false;
        } else if (item.classification !== filterClass) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCustomer = item.customer_name?.toLowerCase().includes(query);
        const matchesProduct = item.product_name?.toLowerCase().includes(query) || item.sku?.toLowerCase().includes(query);
        const matchesOrder = item.order_id?.toString().includes(query);
        const matchesReason = item.explanation?.toLowerCase().includes(query);
        if (!matchesCustomer && !matchesProduct && !matchesOrder && !matchesReason) {
          return false;
        }
      }

      return true;
    });
  }, [impactData, filterClass, searchQuery]);

  // Recharts Chart Data: Top 10 items or changed items
  const chartData = useMemo(() => {
    if (!impactData?.changes) return [];

    // Focus chart on changed items or top requested items
    const priorityItems = impactData.changes
      .filter((c) => c.changed || c.previous_allocated > 0 || c.current_allocated > 0)
      .slice(0, 8);

    return priorityItems.map((item) => ({
      name: `#${item.order_id} ${item.sku}`,
      customer: item.customer_name,
      previous: item.previous_allocated,
      current: item.current_allocated,
      delta: item.delta,
      requested: item.requested_quantity,
    }));
  }, [impactData]);

  const summary = impactData?.summary || {
    total_items_compared: 0,
    total_changed: 0,
    total_unchanged: 0,
    improvements: 0,
    degradations: 0,
    by_classification: {},
  };

  const byClass = summary.by_classification || {};

  return (
    <div className="space-y-6 pb-12 font-mono">
      {/* Top Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs text-cyan-400 border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>PHASE 9 ALLOCATION IMPACT ANALYZER</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-arcade-primary">
              Allocation Impact <span className="text-arcade-accent">&amp;</span> Diff Engine
            </h1>
            <p className="text-arcade-secondary text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
              Precision before/after diffing between sequential allocation iterations with root-cause attribution
              linked to audit logs, stock receipts, and priority approvals.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCompareLatest}
              disabled={comparing}
              className="px-3.5 py-2 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 flex items-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(200,255,58,0.3)] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${comparing ? 'animate-spin' : ''}`} />
              <span>Compare Latest Runs</span>
            </button>
          </div>
        </div>

        {/* Run Selection Form */}
        <form onSubmit={handleRunSelect} className="mt-6 pt-5 border-t border-arcade-border grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
              Base Run (Previous / Run A)
            </label>
            <select
              aria-label="Select Base Run"
              value={selectedBaseRun}
              onChange={(e) => setSelectedBaseRun(e.target.value)}
              className="w-full bg-arcade-surface border border-arcade-border px-3 py-2 text-xs text-arcade-primary focus:border-arcade-accent outline-none"
            >
              <option value="">Select Base Run</option>
              {runs.map((r) => (
                <option key={`base-${r.id}`} value={r.id}>
                  Run #{r.id} ({new Date(r.created_at).toLocaleString()}) - {r.total_items_considered} items {r.notes ? `[${r.notes}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:flex md:col-span-1 items-center justify-center pb-2 text-arcade-secondary">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="md:col-span-5">
            <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
              Target Run (Current / Run B)
            </label>
            <select
              aria-label="Select Target Run"
              value={selectedTargetRun}
              onChange={(e) => setSelectedTargetRun(e.target.value)}
              className="w-full bg-arcade-surface border border-arcade-border px-3 py-2 text-xs text-arcade-primary focus:border-arcade-accent outline-none"
            >
              <option value="">Select Target Run</option>
              {runs.map((r) => (
                <option key={`target-${r.id}`} value={r.id}>
                  Run #{r.id} ({new Date(r.created_at).toLocaleString()}) - {r.total_items_considered} items {r.notes ? `[${r.notes}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={comparing || !selectedBaseRun || !selectedTargetRun}
              className="w-full py-2 bg-arcade-surface border border-arcade-accent text-arcade-accent font-semibold text-xs uppercase tracking-wider hover:bg-arcade-accent/10 transition-colors disabled:opacity-40"
            >
              Diff
            </button>
          </div>
        </form>

        {/* Runs Meta Bar */}
        {impactData && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-arcade-secondary border-t border-arcade-border/50 pt-3">
            <div className="flex items-center space-x-1">
              <span className="text-arcade-secondary">Base:</span>
              <span className="text-arcade-primary font-bold">Run #{impactData.base_run.id}</span>
              <span>({new Date(impactData.base_run.created_at).toLocaleTimeString()})</span>
            </div>
            <span>→</span>
            <div className="flex items-center space-x-1">
              <span className="text-arcade-secondary">Target:</span>
              <span className="text-arcade-primary font-bold text-arcade-accent">Run #{impactData.target_run.id}</span>
              <span>({new Date(impactData.target_run.created_at).toLocaleTimeString()})</span>
            </div>
            <div className="ml-auto text-[10px] text-arcade-secondary">
              Total items compared: <span className="text-arcade-primary font-semibold">{summary.total_items_compared}</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="border border-arcade-danger/30 bg-arcade-danger/10 p-4 text-arcade-danger text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setFilterClass('ALL')}
          className={`border p-3.5 text-left transition-all ${
            filterClass === 'ALL'
              ? 'border-arcade-accent bg-arcade-accent/10'
              : 'border-arcade-border bg-arcade-neutral hover:border-arcade-secondary'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-arcade-secondary">Total Compared</div>
          <div className="text-2xl font-display font-black text-arcade-primary mt-1">
            {summary.total_items_compared}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">{summary.total_changed} items shifted</div>
        </button>

        <button
          onClick={() => setFilterClass('NEWLY_FULFILLED')}
          className={`border p-3.5 text-left transition-all ${
            filterClass === 'NEWLY_FULFILLED'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-arcade-border bg-arcade-neutral hover:border-emerald-500/50'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Newly Fulfilled</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-display font-black text-emerald-400 mt-1">
            {byClass.NEWLY_FULFILLED || 0}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Zero to 100% fulfill</div>
        </button>

        <button
          onClick={() => setFilterClass('IMPROVED')}
          className={`border p-3.5 text-left transition-all ${
            filterClass === 'IMPROVED'
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-arcade-border bg-arcade-neutral hover:border-cyan-500/50'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-cyan-400 flex items-center justify-between">
            <span>Improved Qty</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-display font-black text-cyan-400 mt-1">
            {byClass.IMPROVED || 0}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Positive qty delta</div>
        </button>

        <button
          onClick={() => setFilterClass('DEGRADED')}
          className={`border p-3.5 text-left transition-all ${
            filterClass === 'DEGRADED'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-arcade-border bg-arcade-neutral hover:border-amber-500/50'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-amber-400 flex items-center justify-between">
            <span>Degraded Qty</span>
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-display font-black text-amber-400 mt-1">
            {byClass.DEGRADED || 0}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Negative qty delta</div>
        </button>

        <button
          onClick={() => setFilterClass('NEWLY_DEFERRED')}
          className={`border p-3.5 text-left transition-all ${
            filterClass === 'NEWLY_DEFERRED'
              ? 'border-rose-500 bg-rose-500/10'
              : 'border-arcade-border bg-arcade-neutral hover:border-rose-500/50'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-rose-400 flex items-center justify-between">
            <span>Newly Deferred</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-display font-black text-rose-400 mt-1">
            {byClass.NEWLY_DEFERRED || 0}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Dropped to 0 units</div>
        </button>

        <button
          onClick={() => setFilterClass('UNCHANGED')}
          className={`border p-3.5 text-left transition-all ${
            filterClass === 'UNCHANGED'
              ? 'border-slate-500 bg-slate-500/10'
              : 'border-arcade-border bg-arcade-neutral hover:border-slate-500/50'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-arcade-secondary">Unchanged</div>
          <div className="text-2xl font-display font-black text-arcade-secondary mt-1">
            {byClass.UNCHANGED || 0}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Stable allocation</div>
        </button>
      </div>

      {/* Visual Before/After Recharts Comparison Chart */}
      {chartData.length > 0 && (
        <div className="border border-arcade-border bg-arcade-neutral p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-arcade-accent" />
              <h3 className="font-display font-bold text-base uppercase text-arcade-primary">
                Allocation Quantity Comparison (Run #{impactData?.base_run?.id} vs Run #{impactData?.target_run?.id})
              </h3>
            </div>
            <span className="text-[11px] text-arcade-secondary">
              Units allocated per evaluated order item
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#8a8f80" tick={{ fontSize: 10 }} />
                <YAxis stroke="#8a8f80" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0b08',
                    borderColor: 'rgba(238,240,230,0.18)',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                  }}
                  itemStyle={{ color: '#eef0e6' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="previous" name={`Run #${impactData?.base_run?.id} (Previous)`} fill="#8a8f80" />
                <Bar dataKey="current" name={`Run #${impactData?.target_run?.id} (Current)`} fill="#c8ff3a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-arcade-neutral border border-arcade-border p-3">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-arcade-secondary ml-1" />
          <input
            type="text"
            placeholder="Search order #, customer, SKU, or cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-xs text-arcade-primary placeholder-arcade-secondary outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-arcade-secondary" />
          <select
            aria-label="Filter by classification"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-arcade-surface border border-arcade-border px-2.5 py-1 text-xs text-arcade-primary outline-none focus:border-arcade-accent"
          >
            <option value="ALL">All Changes ({summary.total_items_compared})</option>
            <option value="CHANGED_ONLY">Changed Only ({summary.total_changed})</option>
            <option value="NEWLY_FULFILLED">Newly Fulfilled ({byClass.NEWLY_FULFILLED || 0})</option>
            <option value="IMPROVED">Improved ({byClass.IMPROVED || 0})</option>
            <option value="DEGRADED">Degraded ({byClass.DEGRADED || 0})</option>
            <option value="NEWLY_DEFERRED">Newly Deferred ({byClass.NEWLY_DEFERRED || 0})</option>
            <option value="NEW_ITEM">New Items ({byClass.NEW_ITEM || 0})</option>
            <option value="REMOVED_ITEM">Removed Items ({byClass.REMOVED_ITEM || 0})</option>
            <option value="UNCHANGED">Unchanged ({byClass.UNCHANGED || 0})</option>
          </select>
        </div>
      </div>

      {/* Impact Changes Table */}
      <div className="border border-arcade-border bg-arcade-neutral overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arcade-border bg-arcade-surface/60 text-[11px] uppercase tracking-wider text-arcade-secondary">
                <th className="py-3 px-4">Order / Customer</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4 text-right">Base Alloc (A)</th>
                <th className="py-3 px-4 text-right">Target Alloc (B)</th>
                <th className="py-3 px-4 text-center">Delta</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Attributed Cause &amp; Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arcade-border/50">
              {filteredChanges.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-arcade-secondary">
                    {loading ? 'Analyzing allocation runs...' : 'No allocation items match the selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredChanges.map((item) => {
                  const deltaColor =
                    item.delta > 0
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : item.delta < 0
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      : 'text-arcade-secondary bg-arcade-surface border-arcade-border';

                  return (
                    <tr
                      key={`change-${item.order_item_id}`}
                      className={`hover:bg-arcade-surface/40 transition-colors ${
                        item.changed ? 'bg-arcade-surface/15' : ''
                      }`}
                    >
                      {/* Order & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-arcade-primary">ORDER #{item.order_id}</div>
                        <div className="text-[11px] text-arcade-secondary flex items-center space-x-1 mt-0.5">
                          <User className="w-3 h-3 text-arcade-secondary" />
                          <span>{item.customer_name}</span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="text-arcade-primary font-medium">{item.product_name}</div>
                        <div className="text-[10px] text-arcade-secondary flex items-center space-x-2 mt-0.5">
                          <span className="font-mono text-arcade-accent">{item.sku}</span>
                          <span>·</span>
                          <span>Req: {item.requested_quantity}</span>
                          {item.minimum_acceptable_quantity && (
                            <>
                              <span>·</span>
                              <span>Min: {item.minimum_acceptable_quantity}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Base Allocation */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono text-sm text-arcade-primary font-semibold">
                          {item.previous_allocated}
                        </div>
                        <div className="mt-1 flex justify-end">
                          <StatusPill status={item.previous_status || 'not_present'} />
                        </div>
                      </td>

                      {/* Target Allocation */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono text-sm text-arcade-accent font-bold">
                          {item.current_allocated}
                        </div>
                        <div className="mt-1 flex justify-end">
                          <StatusPill status={item.current_status || 'not_present'} />
                        </div>
                      </td>

                      {/* Delta */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 text-xs font-mono font-bold border ${deltaColor}`}>
                          {item.delta > 0 ? `+${item.delta}` : item.delta}
                        </span>
                      </td>

                      {/* Classification Badge */}
                      <td className="py-3.5 px-4">
                        <ImpactBadge classification={item.classification} />
                      </td>

                      {/* Cause Attribution & Explanation */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <CauseAttributionBadge
                          causeType={item.cause_attribution?.cause_type}
                          description={item.cause_description}
                          triggerEvent={item.cause_attribution?.trigger_event}
                        />
                        {item.explanation && (
                          <p className="text-[11px] text-arcade-secondary mt-1 font-sans italic">
                            "{item.explanation}"
                          </p>
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
  );
}
