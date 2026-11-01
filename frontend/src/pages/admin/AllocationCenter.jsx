import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles,
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
    <div className="space-y-6 font-sans py-2">
      {/* Header Card */}
      <div className="card-base flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[12px] font-mono text-ac font-medium mb-1">
            <Cpu className="h-3.5 w-3.5" />
            <span>Deterministic allocation engine</span>
          </div>
          <h1 className="text-[34px] font-bold tracking-[-0.02em] text-white">
            Allocation Center
          </h1>
          <p className="text-[14px] text-t2 mt-0.5">
            Execute deterministic multi-tier order allocations across competing customer demand queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <Link
            to="/admin/ai"
            className="btn-secondary min-h-[44px] px-4 text-[14px] flex items-center space-x-1.5"
          >
            <Sparkles className="h-4 w-4 text-ac" />
            <span>AI Priorities</span>
          </Link>
          <Link
            to="/admin/impact"
            className="btn-secondary min-h-[44px] px-4 text-[14px] flex items-center space-x-1.5"
          >
            <Layers className="h-4 w-4 text-ac" />
            <span>Impact Analyzer</span>
          </Link>
          <button
            onClick={() => setRunModalOpen(true)}
            aria-label="Run Engine"
            className="btn-primary space-x-2"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Run Engine</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/30 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline hover:text-white text-[12px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Latest Run Metric Card */}
      {selectedRun && (
        <div className="card-base space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-bd pb-3">
            <div>
              <span className="text-[12px] font-mono font-medium text-ac block">
                Active inspection run
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-[20px] font-bold text-white">
                  Run #{selectedRun.id}
                </span>
                <span className="text-[12px] font-mono px-2.5 py-0.5 rounded-pill bg-s2 border border-bd text-t2">
                  {new Date(selectedRun.created_at).toLocaleString()}
                </span>
                {selectedRun.input_hash && (
                  <span className="text-[12px] font-mono px-2.5 py-0.5 rounded-pill border border-ac/30 text-white bg-ac/10 flex items-center space-x-1">
                    <Hash className="h-3 w-3 text-ac" />
                    <span>{selectedRun.input_hash.slice(0, 10)}...</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                className="btn-secondary min-h-[38px] px-4 text-[13px] flex items-center space-x-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-card bg-s2 border border-bd">
              <span className="text-[12px] font-mono text-t2 block">
                Total Evaluated
              </span>
              <span className="text-[34px] font-bold text-white block my-0.5">
                {runResults.length}
              </span>
              <span className="text-[11px] font-mono text-t2">Order items</span>
            </div>

            <div className="p-4 rounded-card bg-s2 border border-ok/30">
              <span className="text-[12px] font-mono text-ok font-medium block">
                Fulfilled
              </span>
              <span className="text-[34px] font-bold text-ok block my-0.5">
                {runResults.filter((r) => r.status === 'fulfilled').length}
              </span>
              <span className="text-[11px] font-mono text-ok/80">100% satisfied</span>
            </div>

            <div className="p-4 rounded-card bg-s2 border border-wa/30">
              <span className="text-[12px] font-mono text-wa font-medium block">
                Partially Fulfilled
              </span>
              <span className="text-[34px] font-bold text-wa block my-0.5">
                {runResults.filter((r) => r.status === 'partially_fulfilled').length}
              </span>
              <span className="text-[11px] font-mono text-wa/80">Minimum met</span>
            </div>

            <div className="p-4 rounded-card bg-s2 border border-no/30">
              <span className="text-[12px] font-mono text-no font-medium block">
                Deferred
              </span>
              <span className="text-[34px] font-bold text-no block my-0.5">
                {runResults.filter((r) => r.status === 'deferred').length}
              </span>
              <span className="text-[11px] font-mono text-no/80">0 units allocated</span>
            </div>
          </div>
        </div>
      )}

      {/* Results Matrix Table Card */}
      <div className="card-base space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bd pb-4">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-ac" />
            <h2 className="text-[20px] font-bold text-white">
              Allocation decisions &amp; explanations ({filteredResults.length})
            </h2>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 border border-bd rounded-pill bg-s2 p-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-t2 ml-2" />
            {['all', 'fulfilled', 'partially_fulfilled', 'deferred'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-pill font-mono text-[11px] font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-ac text-white'
                    : 'text-t2 hover:text-white'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {loadingResults ? (
          <div className="p-12 text-center text-t2 flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-ac" />
            <span className="font-mono text-[12px]">Loading run decision log...</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center text-t2 font-sans text-[14px]">
            No allocation decisions match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-bd text-t2 font-mono text-[12px]">
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
              <tbody className="divide-y divide-bd/60">
                {filteredResults.map((res) => (
                  <tr key={res.id || `${res.order_id}-${res.product_id}`} className="hover:bg-s2/50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-white font-mono text-[13px]">
                      #{res.order_id}
                    </td>
                    <td className="py-3.5 px-3 text-white">
                      {res.customer_name || 'Customer'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-white">{res.product_name}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge priority={res.approved_priority || 'MEDIUM'} />
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-white">
                      {res.requested_quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-ac">
                      {res.allocated_quantity}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <StatusPill status={res.status} />
                    </td>
                    <td className="py-3.5 px-4 text-t2 text-[13px] max-w-md leading-relaxed">
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
      <div className="card-base space-y-4">
        <div className="flex items-center space-x-2 border-b border-bd pb-4">
          <History className="h-4 w-4 text-ac" />
          <h2 className="text-[20px] font-bold text-white">
            Past allocation runs ({runs.length})
          </h2>
        </div>

        {loadingHistory ? (
          <div className="p-8 text-center text-t2 font-mono text-[12px]">Loading history...</div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center text-t2 text-[14px]">
            No allocation runs recorded yet. Click &ldquo;Run Engine&rdquo; to execute the first run.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-bd text-t2 font-mono text-[12px]">
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Execution Time</th>
                  <th className="py-2.5 px-3">Initiated By</th>
                  <th className="py-2.5 px-3">Input Hash</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bd/50">
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => loadRunDetails(r.id)}
                    className={`hover:bg-s2/60 cursor-pointer transition-colors ${
                      selectedRun?.id === r.id ? 'bg-s2' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      #{r.id}
                    </td>
                    <td className="py-3.5 px-3 text-t2 font-mono text-[12px]">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-white">
                      {r.initiated_by_name || 'Administrator'}
                    </td>
                    <td className="py-3.5 px-3 text-t2 font-mono text-[12px]">
                      {r.input_hash ? r.input_hash.slice(0, 16) : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-[12px] font-mono font-medium px-2.5 py-0.5 rounded-pill border border-ok/30 text-ok bg-ok/10">
                        {r.status || 'completed'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-white hover:text-ac text-[12px] font-mono font-medium transition-colors">
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
        <div className="space-y-4 text-sm font-sans">
          <div className="p-4 rounded-card bg-s2 border border-bd text-t2 space-y-1.5">
            <span className="font-semibold text-white block">
              Deterministic Invariant Guarantee
            </span>
            <p className="text-[13px] leading-relaxed">
              Order items will be sorted by Approved Priority DESC &gt; Promised Delivery Date ASC &gt; Order Created Date ASC. Physical warehouse reservations will be updated within a strict database transaction.
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Product Scope
            </label>
            <select
              value={selectedProductIds}
              onChange={(e) => setSelectedProductIds(e.target.value)}
              className="w-full bg-s2 border border-bd rounded-pill px-4 py-2.5 text-white focus:border-white focus:outline-none font-sans text-[14px]"
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
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Audit Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Scheduled morning allocation batch run"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-s2 border border-bd rounded-pill px-4 py-2.5 text-white placeholder-t2/50 focus:border-white focus:outline-none font-sans text-[14px]"
            />
          </div>

          <div className="p-4 rounded-card bg-s2 border border-bd flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Dry-Run Simulation Mode</span>
              <span className="text-[12px] text-t2">
                Compute allocations without modifying database reservations
              </span>
            </div>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="accent-ac h-4 w-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-bd">
            <button
              onClick={() => setRunModalOpen(false)}
              className="btn-secondary min-h-[40px] px-4 text-[13px]"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteAllocation}
              disabled={executing}
              aria-label="Execute Allocation"
              className="btn-primary min-h-[40px] px-5 text-[13px] disabled:opacity-50"
            >
              {executing ? 'Executing Run...' : dryRun ? 'Run Dry Simulation' : 'Execute Allocation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
