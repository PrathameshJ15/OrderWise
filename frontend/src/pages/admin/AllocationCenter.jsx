import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Play,
  RefreshCw,
  AlertTriangle,
  History,
  Download,
  Hash,
  Layers,
  Filter,
} from 'lucide-react';
import apiClient from '../../api/client';
import StatusPill from '../../components/ui/StatusPill';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export default function AllocationCenter() {
  const [runs, setRuns] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [runResults, setRunResults] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);

  // Run Execution Panel State
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState('all');
  const [dryRun, setDryRun] = useState(false);
  const [notes, setNotes] = useState('');
  const [executing, setExecuting] = useState(false);

  // Results Filter
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchCatalogAndHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError(null);
    try {
      const [prodRes, runsRes] = await Promise.all([
        apiClient.get('/products?active=true'),
        apiClient.get('/allocation/runs'),
      ]);
      setProducts(prodRes.data || []);
      const runList = runsRes.data || [];
      setRuns(runList);

      // If past runs exist, load the latest run's results
      if (runList.length > 0) {
        loadRunDetails(runList[0].id);
      }
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to initialize Allocation Center.');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogAndHistory();
  }, [fetchCatalogAndHistory]);

  const loadRunDetails = async (runId) => {
    setLoadingResults(true);
    setError(null);
    try {
      const res = await apiClient.get(`/allocation/runs/${runId}`);
      setSelectedRun(res.data.run);
      setRunResults(res.data.results || []);
    } catch (_err) {
      setError('Failed to fetch allocation run results.');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleExecuteAllocation = async () => {
    setExecuting(true);
    setError(null);
    try {
      const res = await apiClient.post('/allocation/run', {
        product_ids: selectedProductIds === 'all' ? 'all' : selectedProductIds,
        dry_run: dryRun,
        notes: notes.trim() || undefined,
      });

      const outcome = res.data;
      setRunModalOpen(false);

      if (dryRun) {
        // Display dry run simulated results directly
        setSelectedRun({
          id: 'DRY-RUN',
          status: 'simulated',
          input_hash: outcome.input_hash,
          notes: 'Dry Run Simulation (No database records modified)',
          summary: outcome.summary,
          created_at: new Date().toISOString(),
        });
        setRunResults(outcome.results || []);
      } else {
        // Real run completed -> refresh history and load details
        await fetchCatalogAndHistory();
        if (outcome.run_id) {
          await loadRunDetails(outcome.run_id);
        }
      }
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Allocation execution failed.');
    } finally {
      setExecuting(false);
    }
  };

  const handleExportCSV = () => {
    if (!runResults || runResults.length === 0) return;
    const headers = ['Order ID', 'Product', 'Requested', 'Allocated', 'Status', 'Priority', 'Explanation'];
    const rows = runResults.map((r) => [
      r.order_id,
      `"${r.product_name || ''}"`,
      r.requested_quantity,
      r.allocated_quantity,
      r.status,
      r.approved_priority || 'MEDIUM',
      `"${(r.explanation || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `allocation-run-${selectedRun?.id || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = runResults.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <Cpu className="h-3 w-3" />
            <span>DETERMINISTIC ALLOCATION ENGINE</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Allocation Center
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Execute deterministic multi-tier order allocations across competing customer demand queues.
          </p>
        </div>

        <button
          onClick={() => setRunModalOpen(true)}
          aria-label="Run Engine"
          className="flex items-center space-x-2 px-5 py-3 bg-arcade-accent text-arcade-surface font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity self-start md:self-auto shadow-[0_0_15px_rgba(200,255,58,0.3)]"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Run Engine</span>
        </button>
      </div>

      {error && (
        <div className="p-4 border border-arcade-danger/40 bg-arcade-danger/10 text-arcade-danger text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline hover:text-white text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Latest Run Metric Card */}
      {selectedRun && (
        <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-arcade-border pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-arcade-accent tracking-wider block">
                Active Inspection Run
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-display text-xl uppercase font-bold text-arcade-primary">
                  Run #{selectedRun.id}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-arcade-surface border border-arcade-border text-arcade-secondary">
                  {new Date(selectedRun.created_at).toLocaleString()}
                </span>
                {selectedRun.input_hash && (
                  <span className="text-[9px] px-1.5 py-0.5 border border-arcade-accent/30 text-arcade-accent flex items-center space-x-1">
                    <Hash className="h-2.5 w-2.5" />
                    <span>{selectedRun.input_hash.slice(0, 10)}...</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-arcade-border hover:border-arcade-accent text-arcade-primary hover:text-arcade-accent text-xs uppercase tracking-wider transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-arcade-surface border border-arcade-border">
              <span className="text-[10px] uppercase text-arcade-secondary block">
                Total Evaluated
              </span>
              <span className="text-2xl font-bold text-arcade-primary">
                {runResults.length}
              </span>
              <span className="text-[10px] text-arcade-secondary">Order items</span>
            </div>

            <div className="p-3 bg-arcade-surface border border-arcade-accent/30">
              <span className="text-[10px] uppercase text-arcade-accent block">
                Fulfilled
              </span>
              <span className="text-2xl font-bold text-arcade-accent">
                {runResults.filter((r) => r.status === 'fulfilled').length}
              </span>
              <span className="text-[10px] text-arcade-accent/80">100% satisfied</span>
            </div>

            <div className="p-3 bg-arcade-surface border border-arcade-warning/30">
              <span className="text-[10px] uppercase text-arcade-warning block">
                Partially Fulfilled
              </span>
              <span className="text-2xl font-bold text-arcade-warning">
                {runResults.filter((r) => r.status === 'partially_fulfilled').length}
              </span>
              <span className="text-[10px] text-arcade-warning/80">Minimum met</span>
            </div>

            <div className="p-3 bg-arcade-surface border border-arcade-danger/30">
              <span className="text-[10px] uppercase text-arcade-danger block">
                Deferred
              </span>
              <span className="text-2xl font-bold text-arcade-danger">
                {runResults.filter((r) => r.status === 'deferred').length}
              </span>
              <span className="text-[10px] text-arcade-danger/80">0 units allocated</span>
            </div>
          </div>
        </div>
      )}

      {/* Results Matrix Table */}
      <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-arcade-border pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-arcade-accent" />
            <h2 className="font-display text-base uppercase font-bold text-arcade-primary">
              Allocation Decisions &amp; Explanations ({filteredResults.length})
            </h2>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 border border-arcade-border bg-arcade-surface p-1 text-xs">
            <Filter className="h-3 w-3 text-arcade-secondary ml-1" />
            {['all', 'fulfilled', 'partially_fulfilled', 'deferred'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-0.5 uppercase tracking-wider text-[10px] transition-colors ${
                  statusFilter === st
                    ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                    : 'text-arcade-secondary hover:text-arcade-primary'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {loadingResults ? (
          <div className="p-12 text-center text-arcade-secondary flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-arcade-accent" />
            <span>Loading run decision log...</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center text-arcade-secondary">
            No allocation decisions match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arcade-border bg-arcade-surface/60 text-arcade-secondary uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3 text-center">Priority</th>
                  <th className="py-3 px-3 text-right">Requested</th>
                  <th className="py-3 px-3 text-right">Allocated</th>
                  <th className="py-3 px-3 text-center">Decision</th>
                  <th className="py-3 px-4">Deterministic Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arcade-border/50">
                {filteredResults.map((res) => (
                  <tr key={res.id || `${res.order_id}-${res.product_id}`} className="hover:bg-arcade-surface/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-arcade-primary">
                      #{res.order_id}
                    </td>
                    <td className="py-3 px-3 text-arcade-primary">
                      {res.customer_name || 'Customer'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-arcade-primary">{res.product_name}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge priority={res.approved_priority || 'MEDIUM'} />
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-arcade-primary">
                      {res.requested_quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-arcade-accent">
                      {res.allocated_quantity}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusPill status={res.status} />
                    </td>
                    <td className="py-3 px-4 text-arcade-secondary text-[11px] max-w-md leading-relaxed">
                      {typeof res.explanation === 'object' && res.explanation !== null
                        ? res.explanation.reason || JSON.stringify(res.explanation)
                        : (res.explanation || '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Past Run History */}
      <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-4">
        <div className="flex items-center space-x-2 border-b border-arcade-border pb-3">
          <History className="h-4 w-4 text-arcade-accent" />
          <h2 className="font-display text-base uppercase font-bold text-arcade-primary">
            Past Allocation Runs ({runs.length})
          </h2>
        </div>

        {loadingHistory ? (
          <div className="p-8 text-center text-arcade-secondary">Loading history...</div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center text-arcade-secondary">
            No allocation runs recorded yet. Click &ldquo;Run Allocation Engine&rdquo; to execute the first run.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arcade-border bg-arcade-surface/60 text-arcade-secondary uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Execution Time</th>
                  <th className="py-2.5 px-3">Initiated By</th>
                  <th className="py-2.5 px-3">Input Hash</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arcade-border/40">
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => loadRunDetails(r.id)}
                    className={`hover:bg-arcade-surface/50 cursor-pointer transition-colors ${
                      selectedRun?.id === r.id ? 'bg-arcade-surface/70' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-arcade-accent">
                      #{r.id}
                    </td>
                    <td className="py-3 px-3 text-arcade-secondary">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-arcade-primary">
                      {r.initiated_by_name || 'Administrator'}
                    </td>
                    <td className="py-3 px-3 text-arcade-secondary font-mono text-[10px]">
                      {r.input_hash ? r.input_hash.slice(0, 16) : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 border border-arcade-accent/30 text-arcade-accent bg-arcade-accent/10">
                        {r.status || 'completed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-arcade-accent text-[11px] font-bold uppercase hover:underline">
                        View &rarr;
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Run Confirmation & Config Modal */}
      <Modal
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        title="Execute Order Allocation Engine"
      >
        <div className="space-y-4 text-xs font-mono">
          <div className="p-3 bg-arcade-surface border border-arcade-accent/20 text-arcade-secondary space-y-1">
            <span className="font-bold uppercase text-arcade-accent block">
              Deterministic Invariant Guarantee
            </span>
            <p>
              Order items will be sorted by Approved Priority DESC &gt; Promised Delivery Date ASC &gt; Order Created Date ASC. Physical warehouse reservations will be updated within a strict database transaction.
            </p>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
              Product Scope
            </label>
            <select
              value={selectedProductIds}
              onChange={(e) => setSelectedProductIds(e.target.value)}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
            >
              <option value="all">All Active Catalog Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  Only {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
              Audit Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Scheduled morning allocation batch run"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
            />
          </div>

          <div className="p-3 bg-arcade-surface border border-arcade-border flex items-center justify-between">
            <div>
              <span className="font-bold text-arcade-primary uppercase block">Dry-Run Simulation Mode</span>
              <span className="text-[11px] text-arcade-secondary">
                Compute allocations without modifying database reservations
              </span>
            </div>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="accent-arcade-accent h-4 w-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-arcade-border">
            <button
              onClick={() => setRunModalOpen(false)}
              className="px-3 py-1.5 border border-arcade-border text-arcade-secondary uppercase text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteAllocation}
              disabled={executing}
              aria-label="Execute Allocation"
              className="px-5 py-2 bg-arcade-accent text-arcade-surface font-extrabold uppercase text-xs hover:opacity-90 disabled:opacity-50 shadow-[0_0_10px_rgba(200,255,58,0.25)]"
            >
              {executing ? 'Executing Run...' : dryRun ? 'Run Dry Simulation' : 'Execute Allocation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
