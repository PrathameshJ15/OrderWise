import React, { useState, useEffect, useMemo } from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
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
  User,
  CheckCircle2,
  FlaskConical,
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

function SafeLink({ to, className, children }) {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <Link to={to} className={className}>{children}</Link>;
  }
  return <a href={to} className={className}>{children}</a>;
}

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

  // Recharts Chart Data: Top items
  const chartData = useMemo(() => {
    if (!impactData?.changes) return [];

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
    <div className="space-y-6 pb-12 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>PHASE 9 ALLOCATION IMPACT ANALYZER</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            Allocation Impact <span className="text-ac">&amp;</span> Diff Engine
          </h1>
          <p className="text-[14px] text-t2 font-sans max-w-2xl mt-0.5 leading-relaxed">
            Precision before/after diffing between sequential allocation iterations with root-cause attribution
            linked to audit logs, stock receipts, and priority approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SafeLink
            to="/admin/simulations"
            className="btn-secondary min-h-[44px] px-4 text-[14px] flex items-center space-x-1.5"
          >
            <FlaskConical className="w-4 h-4 text-ac" />
            <span>Simulation Lab &rarr;</span>
          </SafeLink>
          <button
            onClick={handleCompareLatest}
            disabled={comparing}
            className="btn-primary flex items-center space-x-1.5 disabled:opacity-50 shadow-[0_6px_24px_rgba(229,9,20,0.4)]"
          >
            <RefreshCw className={`w-4 h-4 ${comparing ? 'animate-spin' : ''}`} />
            <span>Compare Latest Runs</span>
          </button>
        </div>
      </div>

      {/* Run Selection Form Card */}
      <div className="card-base p-6">
        <form onSubmit={handleRunSelect} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-[11px] font-mono text-t2 mb-1.5">
              Base Run (Previous / Run A)
            </label>
            <select
              aria-label="Select Base Run"
              value={selectedBaseRun}
              onChange={(e) => setSelectedBaseRun(e.target.value)}
              className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-[14px] text-t focus:border-ac outline-none"
            >
              <option value="" className="bg-s text-t">Select Base Run</option>
              {runs.map((r) => (
                <option key={`base-${r.id}`} value={r.id} className="bg-s text-t">
                  Run #{r.id} ({new Date(r.created_at).toLocaleString()}) - {r.total_items_considered} items {r.notes ? `[${r.notes}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden md:flex md:col-span-1 items-center justify-center pb-2.5 text-t2">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="md:col-span-5">
            <label className="block text-[11px] font-mono text-t2 mb-1.5">
              Target Run (Current / Run B)
            </label>
            <select
              aria-label="Select Target Run"
              value={selectedTargetRun}
              onChange={(e) => setSelectedTargetRun(e.target.value)}
              className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-[14px] text-t focus:border-ac outline-none"
            >
              <option value="" className="bg-s text-t">Select Target Run</option>
              {runs.map((r) => (
                <option key={`target-${r.id}`} value={r.id} className="bg-s text-t">
                  Run #{r.id} ({new Date(r.created_at).toLocaleString()}) - {r.total_items_considered} items {r.notes ? `[${r.notes}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <button
              type="submit"
              disabled={comparing || !selectedBaseRun || !selectedTargetRun}
              className="btn-header w-full py-2 text-[14px] disabled:opacity-40"
            >
              Diff
            </button>
          </div>
        </form>

        {/* Runs Meta Bar */}
        {impactData && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] font-mono text-t2 border-t border-bd pt-3">
            <div className="flex items-center space-x-1">
              <span>Base:</span>
              <span className="text-t font-bold">Run #{impactData.base_run.id}</span>
              <span>({new Date(impactData.base_run.created_at).toLocaleTimeString()})</span>
            </div>
            <span>→</span>
            <div className="flex items-center space-x-1">
              <span>Target:</span>
              <span className="text-ac font-bold">Run #{impactData.target_run.id}</span>
              <span>({new Date(impactData.target_run.created_at).toLocaleTimeString()})</span>
            </div>
            <div className="ml-auto text-[11px]">
              Total items compared: <span className="text-t font-semibold">{summary.total_items_compared}</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/40 bg-[#291313] text-no text-[13px] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setFilterClass('ALL')}
          className={`p-4 rounded-card border text-left transition-all ${
            filterClass === 'ALL'
              ? 'border-ac bg-ac/10'
              : 'border-bd bg-s hover:border-white'
          }`}
        >
          <div className="text-[11px] font-mono text-t2">Total Compared</div>
          <div className="text-2xl font-bold font-mono text-t mt-1">
            {summary.total_items_compared}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">{summary.total_changed} items shifted</div>
        </button>

        <button
          onClick={() => setFilterClass('NEWLY_FULFILLED')}
          className={`p-4 rounded-card border text-left transition-all ${
            filterClass === 'NEWLY_FULFILLED'
              ? 'border-ok bg-ok/10'
              : 'border-bd bg-s hover:border-ok/50'
          }`}
        >
          <div className="text-[11px] font-mono text-ok flex items-center justify-between">
            <span>Newly Fulfilled</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono text-ok mt-1">
            {byClass.NEWLY_FULFILLED || 0}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Zero to 100% fulfill</div>
        </button>

        <button
          onClick={() => setFilterClass('IMPROVED')}
          className={`p-4 rounded-card border text-left transition-all ${
            filterClass === 'IMPROVED'
              ? 'border-ok bg-ok/10'
              : 'border-bd bg-s hover:border-ok/50'
          }`}
        >
          <div className="text-[11px] font-mono text-ok flex items-center justify-between">
            <span>Improved Qty</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono text-ok mt-1">
            {byClass.IMPROVED || 0}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Positive qty delta</div>
        </button>

        <button
          onClick={() => setFilterClass('DEGRADED')}
          className={`p-4 rounded-card border text-left transition-all ${
            filterClass === 'DEGRADED'
              ? 'border-wa bg-wa/10'
              : 'border-bd bg-s hover:border-wa/50'
          }`}
        >
          <div className="text-[11px] font-mono text-wa flex items-center justify-between">
            <span>Degraded Qty</span>
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono text-wa mt-1">
            {byClass.DEGRADED || 0}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Negative qty delta</div>
        </button>

        <button
          onClick={() => setFilterClass('NEWLY_DEFERRED')}
          className={`p-4 rounded-card border text-left transition-all ${
            filterClass === 'NEWLY_DEFERRED'
              ? 'border-no bg-no/10'
              : 'border-bd bg-s hover:border-no/50'
          }`}
        >
          <div className="text-[11px] font-mono text-no flex items-center justify-between">
            <span>Newly Deferred</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold font-mono text-no mt-1">
            {byClass.NEWLY_DEFERRED || 0}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Dropped to 0 units</div>
        </button>

        <button
          onClick={() => setFilterClass('UNCHANGED')}
          className={`p-4 rounded-card border text-left transition-all ${
            filterClass === 'UNCHANGED'
              ? 'border-bd bg-s2'
              : 'border-bd bg-s hover:border-bd'
          }`}
        >
          <div className="text-[11px] font-mono text-t2">Unchanged</div>
          <div className="text-2xl font-bold font-mono text-t2 mt-1">
            {byClass.UNCHANGED || 0}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Stable allocation</div>
        </button>
      </div>

      {/* Visual Before/After Recharts Comparison Chart */}
      {chartData.length > 0 && (
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-ac" />
              <h3 className="text-base font-bold text-t">
                Allocation Quantity Comparison (Run #{impactData?.base_run?.id} vs Run #{impactData?.target_run?.id})
              </h3>
            </div>
            <span className="text-[12px] font-mono text-t2">
              Units allocated per evaluated order item
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--t2)" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                <YAxis stroke="var(--t2)" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--s)',
                    borderColor: 'var(--bd)',
                    borderRadius: '14px',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'var(--t)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="previous" name={`Run #${impactData?.base_run?.id} (Previous)`} fill="#8A8A8A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" name={`Run #${impactData?.target_run?.id} (Current)`} fill="#E50914" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-base p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 rounded-pill bg-s2 border border-bd px-4 py-2">
          <Search className="w-4 h-4 text-t2 shrink-0" />
          <input
            type="text"
            placeholder="Search order #, customer, SKU, or cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-[14px] text-t placeholder-t2/60 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-t2" />
          <select
            aria-label="Filter by classification"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-s2 rounded-pill border border-bd px-4 py-2 text-[14px] text-t outline-none focus:border-ac"
          >
            <option value="ALL" className="bg-s text-t">All Changes ({summary.total_items_compared})</option>
            <option value="CHANGED_ONLY" className="bg-s text-t">Changed Only ({summary.total_changed})</option>
            <option value="NEWLY_FULFILLED" className="bg-s text-t">Newly Fulfilled ({byClass.NEWLY_FULFILLED || 0})</option>
            <option value="IMPROVED" className="bg-s text-t">Improved ({byClass.IMPROVED || 0})</option>
            <option value="DEGRADED" className="bg-s text-t">Degraded ({byClass.DEGRADED || 0})</option>
            <option value="NEWLY_DEFERRED" className="bg-s text-t">Newly Deferred ({byClass.NEWLY_DEFERRED || 0})</option>
            <option value="NEW_ITEM" className="bg-s text-t">New Items ({byClass.NEW_ITEM || 0})</option>
            <option value="REMOVED_ITEM" className="bg-s text-t">Removed Items ({byClass.REMOVED_ITEM || 0})</option>
            <option value="UNCHANGED" className="bg-s text-t">Unchanged ({byClass.UNCHANGED || 0})</option>
          </select>
        </div>
      </div>

      {/* Impact Changes Table */}
      <div className="card-base p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] border-collapse">
            <thead>
              <tr className="border-b border-bd bg-s2/60 text-[12px] font-sans font-medium uppercase tracking-wider text-t2">
                <th className="py-3.5 px-4">Order / Customer</th>
                <th className="py-3.5 px-4">Product / SKU</th>
                <th className="py-3.5 px-4 text-right">Base Alloc (A)</th>
                <th className="py-3.5 px-4 text-right">Target Alloc (B)</th>
                <th className="py-3.5 px-4 text-center">Delta</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-4">Attributed Cause &amp; Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bd/50">
              {filteredChanges.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-t2">
                    {loading ? 'Analyzing allocation runs...' : 'No allocation items match the selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredChanges.map((item) => {
                  const deltaColor =
                    item.delta > 0
                      ? 'text-ok bg-ok/10 border-ok/30'
                      : item.delta < 0
                      ? 'text-no bg-no/10 border-no/30'
                      : 'text-t2 bg-s2 border-bd';

                  return (
                    <tr
                      key={`change-${item.order_item_id}`}
                      className={`hover:bg-s2/40 transition-colors ${
                        item.changed ? 'bg-s2/20' : ''
                      }`}
                    >
                      {/* Order & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-t">ORDER #{item.order_id}</div>
                        <div className="text-[12px] text-t2 flex items-center space-x-1.5 mt-0.5">
                          <User className="w-3.5 h-3.5 text-t2" />
                          <span>{item.customer_name}</span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="text-t font-medium">{item.product_name}</div>
                        <div className="text-[12px] font-mono text-t2 flex items-center space-x-2 mt-0.5">
                          <span className="text-ac">{item.sku}</span>
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
                        <div className="font-mono text-[14px] text-t font-semibold">
                          {item.previous_allocated}
                        </div>
                        <div className="mt-1 flex justify-end">
                          <StatusPill status={item.previous_status || 'not_present'} />
                        </div>
                      </td>

                      {/* Target Allocation */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono text-[14px] text-ok font-bold">
                          {item.current_allocated}
                        </div>
                        <div className="mt-1 flex justify-end">
                          <StatusPill status={item.current_status || 'not_present'} />
                        </div>
                      </td>

                      {/* Delta */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[12px] font-mono font-bold rounded-pill border ${deltaColor}`}>
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
                          <p className="text-[12px] text-t2 mt-1 italic">
                            &ldquo;{item.explanation}&rdquo;
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
