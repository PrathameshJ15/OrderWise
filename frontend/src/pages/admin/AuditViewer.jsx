import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
} from 'lucide-react';
import apiClient from '../../api/client';

export default function AuditViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('all');
  const [userQuery, setUserQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (actionFilter !== 'all') params.action = actionFilter;
      if (userQuery.trim()) params.user = userQuery.trim();

      const res = await apiClient.get('/audit', { params });
      setLogs(res.data?.logs || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to load audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'RUN_ALLOCATION':
        return {
          label: 'RUN ALLOCATION',
          style: 'border-ac/40 text-ac bg-ac/10',
        };
      case 'PRIORITY_APPROVED':
      case 'PRIORITY_OVERRIDDEN':
        return {
          label: action.replace('_', ' '),
          style: 'border-wa/40 text-wa bg-wa/10',
        };
      case 'STOCK_ADJUSTMENT':
        return {
          label: 'STOCK ADJUSTMENT',
          style: 'border-ok/40 text-ok bg-ok/10',
        };
      case 'ORDER_CONFIRMED':
      case 'ORDER_CANCELLED':
        return {
          label: action.replace('_', ' '),
          style: 'border-bd text-t2 bg-s2',
        };
      default:
        return {
          label: action,
          style: 'border-bd text-t bg-s2',
        };
    }
  };

  return (
    <div className="space-y-6 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Immutable Governance &amp; Audit Trail</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            Audit Log Viewer
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5 max-w-2xl">
            Read-only evidence log: track who approved which priority, who adjusted stock levels, and who executed allocation runs.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="btn-secondary min-h-[42px] flex items-center space-x-2 px-4 py-2 text-[13px] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/40 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline hover:text-t text-[12px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-base p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-t2" />
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Filter by actor name or email..."
              className="w-full bg-s2 rounded-pill border border-bd pl-10 pr-4 py-2 text-[14px] text-t placeholder-t2/60 focus:outline-none focus:border-ac"
            />
          </div>
          <button
            type="submit"
            className="btn-primary px-5 py-2 text-[14px]"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-t2" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-s2 rounded-pill border border-bd px-4 py-2 text-[14px] text-t focus:outline-none focus:border-ac"
          >
            <option value="all" className="bg-s text-t">All Actions</option>
            <option value="RUN_ALLOCATION" className="bg-s text-t">Run Allocation</option>
            <option value="PRIORITY_APPROVED" className="bg-s text-t">Priority Approved</option>
            <option value="STOCK_ADJUSTMENT" className="bg-s text-t">Stock Adjustment</option>
            <option value="ORDER_CONFIRMED" className="bg-s text-t">Order Confirmed</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card-base p-0 overflow-hidden">
        <div className="p-4 border-b border-bd flex items-center justify-between bg-s2/60">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-ac" />
            <span className="text-[14px] font-bold text-t">
              System Audit Records ({logs.length})
            </span>
          </div>
          <span className="text-[11px] font-mono text-t2">
            Read-Only API
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[14px] text-left">
            <thead>
              <tr className="border-b border-bd text-t2 text-[12px] font-sans font-medium uppercase tracking-wider bg-s2/30">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor / User</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Details / Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bd/40">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-t2 text-[14px]">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-s2/40 transition-colors">
                      <td className="p-3.5 text-t2 font-mono text-[12px] whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="h-3.5 w-3.5 text-t2" />
                          <span>
                            {new Date(log.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-t font-semibold">
                          <User className="h-3.5 w-3.5 text-ac" />
                          <span>{log.actor_name || 'System Operator'}</span>
                        </div>
                        <div className="text-[12px] font-mono text-t2">
                          {log.actor_email || 'internal@orderwise.com'}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-mono rounded-pill px-2.5 py-0.5 border font-semibold ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-t">
                        <span className="text-t2 text-[12px] font-mono">
                          {log.entity_type} #
                        </span>
                        <span className="font-mono font-bold">{log.entity_id || 'N/A'}</span>
                      </td>
                      <td className="p-3.5 text-t2 max-w-md truncate text-[13px]">
                        {log.details || log.action}
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
