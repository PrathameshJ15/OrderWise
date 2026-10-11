import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Check,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unresolved: 0,
    critical: 0,
    warning: 0,
    info: 0,
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('unresolved'); // 'all' | 'unresolved' | 'resolved'
  const [severityFilter, setSeverityFilter] = useState('all'); // 'all' | 'critical' | 'warning' | 'info'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter === 'unresolved') params.resolved = false;
      if (statusFilter === 'resolved') params.resolved = true;
      if (severityFilter !== 'all') params.severity = severityFilter;

      const res = await apiClient.get('/alerts', { params });
      setAlerts(res.data.alerts || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to fetch supply alerts.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleRunScan = async () => {
    setScanning(true);
    setError(null);
    try {
      await apiClient.post('/alerts/scan');
      await fetchAlerts();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to trigger diagnostic scan.');
    } finally {
      setScanning(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    setActionInProgress(alertId);
    try {
      await apiClient.patch(`/alerts/${alertId}/resolve`);
      // Update local state smoothly
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, resolved: true, resolved_at: new Date().toISOString(), resolved_by_name: user?.name || 'You' }
            : a
        )
      );
      setStats((prev) => ({
        ...prev,
        unresolved: Math.max(0, prev.unresolved - 1),
      }));
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to resolve alert.');
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      alert.title.toLowerCase().includes(q) ||
      alert.description.toLowerCase().includes(q) ||
      (alert.product_name && alert.product_name.toLowerCase().includes(q)) ||
      (alert.product_sku && alert.product_sku.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-warning bg-arcade-warning/10 border border-arcade-warning/20 px-2 py-0.5 mb-2">
            <AlertTriangle className="h-3 w-3" />
            <span>SUPPLY INTELLIGENCE TELEMETRY</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Supply Alerts Command
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Proactive telemetry monitoring stockout risks, safety buffer breaches, delayed purchase orders, and critical deferred commitments.
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={scanning}
          className="flex items-center space-x-2 px-4 py-2.5 bg-arcade-accent text-arcade-surface hover:bg-arcade-accent/90 disabled:opacity-50 text-xs font-bold uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(200,255,58,0.25)] self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning State...' : 'Run Diagnostic Scan'}</span>
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

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary mb-1">
            <span className="text-[11px] uppercase tracking-wider">Unresolved</span>
            <AlertOctagon className="h-4 w-4 text-arcade-warning" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-primary">
            {stats.unresolved}
          </div>
          <span className="text-[10px] text-arcade-secondary">Pending action</span>
        </div>

        <div className="border border-arcade-danger/30 bg-arcade-danger/5 p-4">
          <div className="flex items-center justify-between text-arcade-danger mb-1">
            <span className="text-[11px] uppercase tracking-wider">Critical</span>
            <AlertTriangle className="h-4 w-4 text-arcade-danger" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-danger">
            {stats.critical}
          </div>
          <span className="text-[10px] text-arcade-danger/80">Stockout or order at risk</span>
        </div>

        <div className="border border-arcade-warning/30 bg-arcade-warning/5 p-4">
          <div className="flex items-center justify-between text-arcade-warning mb-1">
            <span className="text-[11px] uppercase tracking-wider">Warning</span>
            <AlertTriangle className="h-4 w-4 text-arcade-warning" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-warning">
            {stats.warning}
          </div>
          <span className="text-[10px] text-arcade-warning/80">Buffer & lead-time delay</span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary mb-1">
            <span className="text-[11px] uppercase tracking-wider">Total Evaluated</span>
            <ShieldCheck className="h-4 w-4 text-arcade-accent" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-accent">
            {stats.total}
          </div>
          <span className="text-[10px] text-arcade-secondary">Historical telemetry logged</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="border border-arcade-border bg-arcade-neutral p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 border border-arcade-border bg-arcade-surface p-1">
          <button
            onClick={() => setStatusFilter('unresolved')}
            className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
              statusFilter === 'unresolved'
                ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                : 'text-arcade-secondary hover:text-arcade-primary'
            }`}
          >
            Unresolved ({stats.unresolved})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
              statusFilter === 'all'
                ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                : 'text-arcade-secondary hover:text-arcade-primary'
            }`}
          >
            All Alerts ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
              statusFilter === 'resolved'
                ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                : 'text-arcade-secondary hover:text-arcade-primary'
            }`}
          >
            Resolved ({Math.max(0, stats.total - stats.unresolved)})
          </button>
        </div>

        {/* Severity Selector & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center space-x-2 border border-arcade-border bg-arcade-surface px-2.5 py-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-arcade-secondary" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-arcade-primary focus:outline-none uppercase text-xs"
            >
              <option value="all" className="bg-arcade-surface">All Severities</option>
              <option value="critical" className="bg-arcade-surface">Critical Only</option>
              <option value="warning" className="bg-arcade-surface">Warning Only</option>
              <option value="info" className="bg-arcade-surface">Info Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 border border-arcade-border bg-arcade-surface px-2.5 py-1 text-xs">
            <Search className="h-3.5 w-3.5 text-arcade-secondary" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-arcade-primary focus:outline-none text-xs w-36 sm:w-48 placeholder-arcade-secondary/60"
            />
          </div>
        </div>
      </div>

      {/* Alert Feed List */}
      {loading ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-arcade-accent" />
          <span className="text-xs tracking-wider uppercase">Loading supply alerts...</span>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex flex-col items-center justify-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-arcade-accent/80" />
          <h3 className="font-display text-base uppercase text-arcade-primary font-bold">
            Zero Triggered Alerts
          </h3>
          <p className="text-xs text-arcade-secondary max-w-md">
            No supply bottlenecks detected under the current filters. All safety stock thresholds and deliveries are within bounds.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';

            return (
              <div
                key={alert.id}
                className={`border bg-arcade-neutral p-5 transition-all relative ${
                  alert.resolved
                    ? 'border-arcade-border/60 opacity-60'
                    : isCritical
                    ? 'border-arcade-danger/60 bg-arcade-danger/[0.03] shadow-[0_0_15px_rgba(255,59,48,0.06)]'
                    : isWarning
                    ? 'border-arcade-warning/50 bg-arcade-warning/[0.02]'
                    : 'border-arcade-border'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Severity Badge & Alert Info */}
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-8 h-8 flex items-center justify-center mt-0.5 shrink-0 ${
                        isCritical
                          ? 'bg-arcade-danger/10 text-arcade-danger border border-arcade-danger/30'
                          : isWarning
                          ? 'bg-arcade-warning/10 text-arcade-warning border border-arcade-warning/30'
                          : 'bg-arcade-accent/10 text-arcade-accent border border-arcade-accent/30'
                      }`}
                    >
                      {isCritical ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : isWarning ? (
                        <AlertOctagon className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.5 font-bold border tracking-wider ${
                            isCritical
                              ? 'bg-arcade-danger/20 text-arcade-danger border-arcade-danger/40'
                              : isWarning
                              ? 'bg-arcade-warning/20 text-arcade-warning border-arcade-warning/40'
                              : 'bg-arcade-surface text-arcade-secondary border-arcade-border'
                          }`}
                        >
                          {alert.severity}
                        </span>

                        <span className="text-[10px] text-arcade-secondary bg-arcade-surface px-2 py-0.5 border border-arcade-border uppercase">
                          {alert.alert_type.replace(/_/g, ' ')}
                        </span>

                        {alert.product_name && (
                          <span className="text-[10px] text-arcade-accent bg-arcade-accent/10 px-2 py-0.5 border border-arcade-accent/20 flex items-center space-x-1">
                            <Package className="h-3 w-3" />
                            <span>{alert.product_sku || alert.product_name}</span>
                          </span>
                        )}

                        {alert.order_id && (
                          <span className="text-[10px] text-arcade-primary bg-arcade-surface px-2 py-0.5 border border-arcade-border flex items-center space-x-1">
                            <Layers className="h-3 w-3 text-arcade-accent" />
                            <span>Order #{alert.order_id}</span>
                          </span>
                        )}

                        {alert.resolved && (
                          <span className="text-[9px] text-arcade-accent bg-arcade-accent/10 px-2 py-0.5 border border-arcade-accent/30 uppercase font-semibold flex items-center space-x-1">
                            <Check className="h-2.5 w-2.5" />
                            <span>Resolved</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-base font-bold text-arcade-primary">
                        {alert.title}
                      </h3>

                      <p className="text-xs text-arcade-secondary max-w-3xl leading-relaxed">
                        {alert.description}
                      </p>

                      {/* Suggested Action Box */}
                      {alert.suggested_action && (
                        <div className="mt-2.5 p-2.5 border border-arcade-accent/20 bg-arcade-surface text-xs flex items-start space-x-2">
                          <ArrowRight className="h-3.5 w-3.5 text-arcade-accent mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-arcade-accent tracking-wider block">
                              Suggested Action
                            </span>
                            <span className="text-arcade-primary/90 text-[11px]">
                              {alert.suggested_action}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-3 text-[10px] text-arcade-secondary pt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </span>
                        {alert.resolved && alert.resolved_by_name && (
                          <span>• Resolved by {alert.resolved_by_name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Resolve Button */}
                  <div className="shrink-0 flex items-center md:self-center">
                    {!alert.resolved ? (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        disabled={actionInProgress === alert.id}
                        className="flex items-center space-x-1.5 px-3 py-1.5 border border-arcade-border bg-arcade-surface hover:border-arcade-accent hover:text-arcade-accent text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>
                          {actionInProgress === alert.id ? 'Resolving...' : 'Mark Resolved'}
                        </span>
                      </button>
                    ) : (
                      <div className="text-[10px] text-arcade-secondary uppercase tracking-wider flex items-center space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-arcade-accent" />
                        <span>Resolved</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
