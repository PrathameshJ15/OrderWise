import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Clock,
  Package,
  Layers,
  Check,
  CheckCheck,
  ExternalLink,
  Truck,
} from 'lucide-react';
import apiClient from '../../api/client';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active_count: 0,
    acknowledged_count: 0,
    resolved_count: 0,
    critical_unresolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Ensure Admin/Manager Auth
  const ensureAuth = async () => {
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

  const fetchAlerts = async () => {
    try {
      await ensureAuth();
      const res = await apiClient.get('/alerts');
      const data = res.data || {};
      setAlerts(data.alerts || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to fetch supply alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      await ensureAuth();
      await apiClient.post('/alerts/scan');
      await fetchAlerts();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to scan supply alerts');
    } finally {
      setScanning(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    setActionLoading((prev) => ({ ...prev, [alertId]: true }));
    try {
      await apiClient.patch(`/alerts/${alertId}/acknowledge`);
      await fetchAlerts();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to acknowledge alert');
    } finally {
      setActionLoading((prev) => ({ ...prev, [alertId]: false }));
    }
  };

  const handleResolve = async (alertId) => {
    setActionLoading((prev) => ({ ...prev, [alertId]: true }));
    try {
      await apiClient.patch(`/alerts/${alertId}/resolve`);
      await fetchAlerts();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to resolve alert');
    } finally {
      setActionLoading((prev) => ({ ...prev, [alertId]: false }));
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (filterStatus !== 'ALL' && alert.status !== filterStatus) return false;
      if (filterSeverity !== 'ALL' && alert.severity !== filterSeverity) return false;
      if (filterType !== 'ALL' && alert.alert_type !== filterType) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = alert.title?.toLowerCase().includes(q);
        const matchesDesc = alert.description?.toLowerCase().includes(q);
        const matchesProduct = alert.product_name?.toLowerCase().includes(q) || alert.sku?.toLowerCase().includes(q);
        const matchesAction = alert.recommended_action?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesProduct && !matchesAction) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, filterStatus, filterSeverity, filterType, searchQuery]);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]">
            <AlertCircle className="w-3 h-3" />
            <span>Critical</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3" />
            <span>Warning</span>
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/40">
            <Info className="w-3 h-3" />
            <span>Info</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <span>Active</span>
          </span>
        );
      case 'acknowledged':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Check className="w-3 h-3" />
            <span>Acknowledged</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCheck className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-mono">
      {/* Top Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs text-rose-400 border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>PHASE 11 SUPPLY INTELLIGENCE</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-arcade-primary">
              Supply Alerts <span className="text-arcade-accent">&amp;</span> Early Warnings
            </h1>
            <p className="text-arcade-secondary text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
              Proactive monitoring for low stock, potential stockouts, delayed supplier shipments, and orders at risk
              with deduplication and actionable mitigation guidance.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-3.5 py-2 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 flex items-center space-x-1.5 transition-all shadow-[0_0_12px_rgba(200,255,58,0.3)] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Scanning...' : 'Scan Conditions Now'}</span>
            </button>

            <Link
              to="/admin/replenishment"
              className="px-3 py-2 border border-arcade-border bg-arcade-surface text-arcade-primary font-bold text-xs uppercase tracking-wider hover:border-arcade-accent flex items-center space-x-1.5 transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-arcade-accent" />
              <span>Replenishment Lab</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="border border-arcade-danger/30 bg-arcade-danger/10 p-4 text-arcade-danger text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => { setFilterStatus('ALL'); setFilterSeverity('critical'); }}
          className="border border-rose-500/30 bg-rose-500/10 p-4 text-left hover:border-rose-500 transition-all"
        >
          <div className="text-[10px] uppercase tracking-wider text-rose-400 flex items-center justify-between">
            <span>Critical Unresolved</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-display font-black text-rose-400 mt-1">
            {summary.critical_unresolved || 0}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Requires urgent action</div>
        </button>

        <button
          onClick={() => { setFilterStatus('active'); setFilterSeverity('ALL'); }}
          className={`border p-4 text-left transition-all ${
            filterStatus === 'active' && filterSeverity === 'ALL'
              ? 'border-arcade-accent bg-arcade-accent/10'
              : 'border-arcade-border bg-arcade-neutral hover:border-arcade-secondary'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-arcade-secondary flex items-center justify-between">
            <span>Active Alerts</span>
            <AlertTriangle className="w-3.5 h-3.5 text-arcade-accent" />
          </div>
          <div className="text-2xl font-display font-black text-arcade-primary mt-1">
            {summary.active_count || 0}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Pending review</div>
        </button>

        <button
          onClick={() => { setFilterStatus('acknowledged'); setFilterSeverity('ALL'); }}
          className={`border p-4 text-left transition-all ${
            filterStatus === 'acknowledged'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-arcade-border bg-arcade-neutral hover:border-amber-500/50'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-amber-400 flex items-center justify-between">
            <span>Acknowledged</span>
            <Check className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-display font-black text-amber-400 mt-1">
            {summary.acknowledged_count || 0}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Under investigation</div>
        </button>

        <button
          onClick={() => { setFilterStatus('resolved'); setFilterSeverity('ALL'); }}
          className={`border p-4 text-left transition-all ${
            filterStatus === 'resolved'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-arcade-border bg-arcade-neutral hover:border-emerald-500/50'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Resolved</span>
            <CheckCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-display font-black text-emerald-400 mt-1">
            {summary.resolved_count || 0}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">Conditions cleared</div>
        </button>

        <button
          onClick={() => { setFilterStatus('ALL'); setFilterSeverity('ALL'); setFilterType('ALL'); }}
          className={`border p-4 text-left transition-all ${
            filterStatus === 'ALL' && filterSeverity === 'ALL'
              ? 'border-cyan-500 bg-cyan-500/10'
              : 'border-arcade-border bg-arcade-neutral hover:border-cyan-500/50'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-arcade-secondary flex items-center justify-between">
            <span>Total Logged</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-display font-black text-arcade-primary mt-1">
            {summary.total || 0}
          </div>
          <div className="text-[10px] text-arcade-secondary mt-1">History records</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-arcade-neutral border border-arcade-border p-3">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-arcade-secondary ml-1" />
          <input
            type="text"
            placeholder="Search alerts by title, product SKU, action, or cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-xs text-arcade-primary placeholder-arcade-secondary outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-arcade-secondary" />
            <select
              aria-label="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-arcade-surface border border-arcade-border px-2.5 py-1 text-xs text-arcade-primary outline-none focus:border-arcade-accent"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="acknowledged">Acknowledged Only</option>
              <option value="resolved">Resolved Only</option>
            </select>
          </div>

          <select
            aria-label="Filter by severity"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-arcade-surface border border-arcade-border px-2.5 py-1 text-xs text-arcade-primary outline-none focus:border-arcade-accent"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            aria-label="Filter by alert type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-arcade-surface border border-arcade-border px-2.5 py-1 text-xs text-arcade-primary outline-none focus:border-arcade-accent"
          >
            <option value="ALL">All Types</option>
            <option value="low_stock">Low Stock</option>
            <option value="potential_stockout">Potential Stockout</option>
            <option value="below_reorder_point">Below Reorder Point</option>
            <option value="order_at_risk">Order At Risk</option>
            <option value="supplier_delay">Supplier Delay</option>
            <option value="allocation_change_competing">Allocation Shift</option>
          </select>
        </div>
      </div>

      {/* Alerts Stream List */}
      <div className="space-y-3">
        {loading ? (
          <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-arcade-accent" />
            <span>Scanning supply telemetry &amp; inventory state...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary text-xs">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
            <p className="font-bold text-arcade-primary uppercase tracking-wide">No active supply alerts matching filter</p>
            <p className="mt-1 text-arcade-secondary">Inventory positions and orders currently meet configured safety parameters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isResolved = alert.status === 'resolved';
            const isAck = alert.status === 'acknowledged';

            return (
              <div
                key={`alert-${alert.id}`}
                className={`border p-4.5 transition-all ${
                  isResolved
                    ? 'border-arcade-border/40 bg-arcade-neutral/50 opacity-70'
                    : isCritical
                    ? 'border-rose-500/60 bg-arcade-neutral shadow-[0_0_15px_rgba(244,63,94,0.08)]'
                    : 'border-arcade-border bg-arcade-neutral hover:border-arcade-secondary'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      {getStatusBadge(alert.status)}
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border border-arcade-border bg-arcade-surface text-arcade-secondary">
                        {alert.alert_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-arcade-secondary flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-arcade-primary mt-1">
                      {alert.title}
                    </h3>

                    <p className="text-xs text-arcade-secondary leading-relaxed">
                      {alert.description}
                    </p>

                    {/* Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] pt-1">
                      {alert.product_name && (
                        <span className="px-2 py-0.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 flex items-center space-x-1">
                          <Package className="w-3 h-3" />
                          <span>{alert.product_name} ({alert.sku})</span>
                        </span>
                      )}
                      {alert.order_id && (
                        <span className="px-2 py-0.5 border border-arcade-border bg-arcade-surface text-arcade-primary">
                          Order #{alert.order_id} {alert.customer_name ? `(${alert.customer_name})` : ''}
                        </span>
                      )}
                      {alert.po_number && (
                        <span className="px-2 py-0.5 border border-purple-500/30 bg-purple-500/10 text-purple-400 flex items-center space-x-1">
                          <Truck className="w-3 h-3" />
                          <span>PO #{alert.po_number} ({alert.supplier_name})</span>
                        </span>
                      )}
                      {alert.metadata?.inventoryPosition !== undefined && (
                        <span className="px-2 py-0.5 border border-arcade-border bg-arcade-surface text-arcade-secondary">
                          Position: <strong className="text-arcade-primary">{alert.metadata.inventoryPosition}</strong>
                        </span>
                      )}
                    </div>

                    {/* Recommended Action Box */}
                    <div className="mt-3 p-3 border border-arcade-accent/30 bg-arcade-accent/5 flex items-start space-x-2">
                      <ArrowRight className="w-4 h-4 text-arcade-accent flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-arcade-accent uppercase tracking-wider text-[10px] block mb-0.5">
                          Recommended Action:
                        </span>
                        <span className="text-arcade-primary">{alert.recommended_action}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 pt-2 sm:pt-0">
                    {!isResolved && (
                      <>
                        {!isAck && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={actionLoading[alert.id]}
                            className="px-3 py-1.5 border border-amber-500/50 bg-amber-500/15 text-amber-300 font-semibold text-xs uppercase tracking-wider hover:bg-amber-500/25 transition-colors disabled:opacity-50 flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Acknowledge</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleResolve(alert.id)}
                          disabled={actionLoading[alert.id]}
                          className="px-3 py-1.5 border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-semibold text-xs uppercase tracking-wider hover:bg-emerald-500/25 transition-colors disabled:opacity-50 flex items-center space-x-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Resolve</span>
                        </button>
                      </>
                    )}

                    {alert.product_id && (
                      <Link
                        to="/admin/replenishment"
                        className="text-[11px] text-arcade-secondary hover:text-arcade-accent underline flex items-center space-x-1 mt-1"
                      >
                        <span>Replenish</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Audit trail footer */}
                {(alert.acknowledged_at || alert.resolved_at) && (
                  <div className="mt-3 pt-2 border-t border-arcade-border/40 text-[10px] text-arcade-secondary flex flex-wrap gap-4">
                    {alert.acknowledged_at && (
                      <span>
                        Acknowledged by <strong className="text-arcade-primary">{alert.acknowledged_by_name || 'Admin'}</strong> on {new Date(alert.acknowledged_at).toLocaleTimeString()}
                      </span>
                    )}
                    {alert.resolved_at && (
                      <span>
                        Resolved by <strong className="text-arcade-primary">{alert.resolved_by_name || 'Admin'}</strong> on {new Date(alert.resolved_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
