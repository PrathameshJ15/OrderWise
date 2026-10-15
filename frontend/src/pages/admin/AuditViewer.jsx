import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  Calendar,
  AlertCircle,
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
          style: 'border-arcade-accent text-arcade-accent bg-arcade-accent/10',
        };
      case 'PRIORITY_APPROVED':
      case 'PRIORITY_OVERRIDDEN':
        return {
          label: action.replace('_', ' '),
          style: 'border-arcade-warning text-arcade-warning bg-arcade-warning/10',
        };
      case 'STOCK_ADJUSTMENT':
        return {
          label: 'STOCK ADJUSTMENT',
          style: 'border-arcade-info text-arcade-info bg-arcade-info/10',
        };
      case 'ORDER_CONFIRMED':
      case 'ORDER_CANCELLED':
        return {
          label: action.replace('_', ' '),
          style: 'border-arcade-secondary text-arcade-secondary bg-arcade-surface',
        };
      default:
        return {
          label: action,
          style: 'border-arcade-border text-arcade-primary bg-arcade-surface',
        };
    }
  };

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header Banner */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <ShieldCheck className="h-3 w-3" />
            <span>Phase 13 • Immutable Governance &amp; Audit Trail</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Audit Log Viewer
          </h1>
          <p className="text-xs text-arcade-secondary mt-1 max-w-2xl">
            Read-only evidence log: track who approved which priority, who adjusted stock levels, and who executed allocation runs.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3 py-2 border border-arcade-border bg-arcade-surface hover:border-arcade-accent text-arcade-primary text-xs uppercase tracking-wider font-bold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="border border-arcade-border bg-arcade-surface p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-arcade-secondary" />
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Filter by actor name or email..."
              className="w-full bg-arcade-neutral border border-arcade-border px-9 py-2 text-xs text-arcade-primary placeholder-arcade-secondary focus:outline-none focus:border-arcade-accent"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-arcade-accent text-arcade-surface text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-arcade-secondary" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-arcade-neutral border border-arcade-border px-3 py-2 text-xs text-arcade-primary focus:outline-none focus:border-arcade-accent"
          >
            <option value="all">All Actions</option>
            <option value="RUN_ALLOCATION">Run Allocation</option>
            <option value="PRIORITY_APPROVED">Priority Approved</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
            <option value="ORDER_CONFIRMED">Order Confirmed</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="border border-arcade-border bg-arcade-neutral overflow-hidden">
        <div className="p-4 border-b border-arcade-border flex items-center justify-between bg-arcade-surface">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-arcade-accent" />
            <span className="font-display text-sm font-bold uppercase tracking-wider text-arcade-primary">
              System Audit Records ({logs.length})
            </span>
          </div>
          <span className="text-[10px] text-arcade-secondary uppercase tracking-widest">
            Read-Only API
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-arcade-border text-arcade-secondary uppercase text-[10px] bg-arcade-neutral">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor / User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target Entity</th>
                <th className="p-3">Details / Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arcade-border/40 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-arcade-secondary">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-arcade-surface/60 transition-colors">
                      <td className="p-3 text-arcade-secondary whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="h-3 w-3 text-arcade-secondary" />
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
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-arcade-primary font-bold">
                          <User className="h-3.5 w-3.5 text-arcade-accent" />
                          <span>{log.actor_name || 'System Operator'}</span>
                        </div>
                        <div className="text-[10px] text-arcade-secondary">
                          {log.actor_email || 'internal@orderwise.com'}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 border font-bold ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-arcade-primary">
                        <span className="text-arcade-secondary uppercase text-[10px]">
                          {log.entity_type} #
                        </span>
                        <span className="font-bold">{log.entity_id || 'N/A'}</span>
                      </td>
                      <td className="p-3 text-arcade-secondary max-w-md truncate">
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
