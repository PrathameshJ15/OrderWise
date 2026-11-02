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
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold uppercase bg-no/15 text-no border border-no/40">
            <AlertCircle className="w-3 h-3" />
            <span>Critical</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold uppercase bg-wa/15 text-wa border border-wa/40">
            <AlertTriangle className="w-3 h-3" />
            <span>Warning</span>
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold uppercase bg-s2 text-t2 border border-bd">
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
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold uppercase bg-no/10 text-no border border-no/30">
            <span>Active</span>
          </span>
        );
      case 'acknowledged':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold uppercase bg-wa/10 text-wa border border-wa/30">
            <Check className="w-3 h-3" />
            <span>Acknowledged</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold uppercase bg-ok/10 text-ok border border-ok/30">
            <CheckCheck className="w-3 h-3" />
            <span>Resolved</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>PHASE 11 SUPPLY INTELLIGENCE</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-white">
            Supply Alerts <span className="text-ac">&amp;</span> Early Warnings
          </h1>
          <p className="text-[14px] text-t2 font-sans max-w-2xl mt-0.5 leading-relaxed">
            Proactive monitoring for low stock, potential stockouts, delayed supplier shipments, and orders at risk
            with deduplication and actionable mitigation guidance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="btn-primary flex items-center space-x-1.5 disabled:opacity-50 shadow-[0_0_20px_rgba(229,9,20,0.35)]"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Scan Conditions Now'}</span>
          </button>

          <Link
            to="/admin/replenishment"
            className="btn-secondary min-h-[44px] px-4 text-[14px] flex items-center space-x-1.5"
          >
            <Truck className="w-4 h-4 text-ac" />
            <span>Replenishment Lab</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/40 bg-[#291313] text-no text-[13px] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => { setFilterStatus('ALL'); setFilterSeverity('critical'); }}
          className="p-4 rounded-card border border-[#5A4210] bg-[#2B2010] text-left hover:border-wa transition-all"
        >
          <div className="text-[11px] font-mono text-wa flex items-center justify-between">
            <span>Critical Unresolved</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-mono font-bold text-wa mt-1">
            {summary.critical_unresolved || 0}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Requires urgent action</div>
        </button>

        <button
          onClick={() => { setFilterStatus('active'); setFilterSeverity('ALL'); }}
          className={`p-4 rounded-card border text-left transition-all ${
            filterStatus === 'active' && filterSeverity === 'ALL'
              ? 'border-ac bg-ac/10'
              : 'border-bd bg-s hover:border-white'
          }`}
        >
          <div className="text-[11px] font-mono text-t2 flex items-center justify-between">
            <span>Active Alerts</span>
            <AlertTriangle className="w-3.5 h-3.5 text-ac" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-1">
            {summary.active_count || 0}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Pending review</div>
        </button>

        <button
          onClick={() => { setFilterStatus('acknowledged'); setFilterSeverity('ALL'); }}
          className={`p-4 rounded-card border text-left transition-all ${
            filterStatus === 'acknowledged'
              ? 'border-wa bg-wa/10'
              : 'border-bd bg-s hover:border-wa/50'
          }`}
        >
          <div className="text-[11px] font-mono text-wa flex items-center justify-between">
            <span>Acknowledged</span>
            <Check className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-mono font-bold text-wa mt-1">
            {summary.acknowledged_count || 0}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Under investigation</div>
        </button>

        <button
          onClick={() => { setFilterStatus('resolved'); setFilterSeverity('ALL'); }}
          className={`p-4 rounded-card border text-left transition-all ${
            filterStatus === 'resolved'
              ? 'border-ok bg-ok/10'
              : 'border-bd bg-s hover:border-ok/50'
          }`}
        >
          <div className="text-[11px] font-mono text-ok flex items-center justify-between">
            <span>Resolved</span>
            <CheckCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-mono font-bold text-ok mt-1">
            {summary.resolved_count || 0}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">Conditions cleared</div>
        </button>

        <button
          onClick={() => { setFilterStatus('ALL'); setFilterSeverity('ALL'); setFilterType('ALL'); }}
          className={`p-4 rounded-card border text-left transition-all ${
            filterStatus === 'ALL' && filterSeverity === 'ALL'
              ? 'border-bd bg-s2'
              : 'border-bd bg-s hover:border-bd'
          }`}
        >
          <div className="text-[11px] font-mono text-t2 flex items-center justify-between">
            <span>Total Logged</span>
            <Layers className="w-3.5 h-3.5 text-t2" />
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-1">
            {summary.total || 0}
          </div>
          <div className="text-[11px] font-mono text-t2 mt-1">History records</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-base p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 rounded-pill bg-s2 border border-bd px-4 py-2">
          <Search className="w-4 h-4 text-t2 shrink-0" />
          <input
            type="text"
            placeholder="Search alerts by title, product SKU, action, or cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-[14px] text-white placeholder-t2/60 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-4 h-4 text-t2" />
            <select
              aria-label="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-s2 rounded-pill border border-bd px-4 py-2 text-[14px] text-white outline-none focus:border-ac"
            >
              <option value="ALL" className="bg-s text-white">All Statuses</option>
              <option value="active" className="bg-s text-white">Active Only</option>
              <option value="acknowledged" className="bg-s text-white">Acknowledged Only</option>
              <option value="resolved" className="bg-s text-white">Resolved Only</option>
            </select>
          </div>

          <select
            aria-label="Filter by severity"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-s2 rounded-pill border border-bd px-4 py-2 text-[14px] text-white outline-none focus:border-ac"
          >
            <option value="ALL" className="bg-s text-white">All Severities</option>
            <option value="critical" className="bg-s text-white">Critical</option>
            <option value="warning" className="bg-s text-white">Warning</option>
            <option value="info" className="bg-s text-white">Info</option>
          </select>

          <select
            aria-label="Filter by alert type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-s2 rounded-pill border border-bd px-4 py-2 text-[14px] text-white outline-none focus:border-ac"
          >
            <option value="ALL" className="bg-s text-white">All Types</option>
            <option value="low_stock" className="bg-s text-white">Low Stock</option>
            <option value="potential_stockout" className="bg-s text-white">Potential Stockout</option>
            <option value="below_reorder_point" className="bg-s text-white">Below Reorder Point</option>
            <option value="order_at_risk" className="bg-s text-white">Order At Risk</option>
            <option value="supplier_delay" className="bg-s text-white">Supplier Delay</option>
            <option value="allocation_change_competing" className="bg-s text-white">Allocation Shift</option>
          </select>
        </div>
      </div>

      {/* Alerts Stream List */}
      <div className="space-y-3">
        {loading ? (
          <div className="card-base p-12 text-center text-t2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-ac" />
            <span className="font-mono text-[12px]">Scanning supply telemetry &amp; inventory state...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="card-base p-12 text-center text-t2">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-ok" />
            <p className="font-bold text-white">No active supply alerts matching filter</p>
            <p className="mt-1 text-[14px] text-t2">Inventory positions and orders currently meet configured safety parameters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isResolved = alert.status === 'resolved';
            const isAck = alert.status === 'acknowledged';

            return (
              <div
                key={`alert-${alert.id}`}
                className={`card-base transition-all ${
                  isResolved
                    ? 'opacity-60 border-bd/40'
                    : isCritical
                    ? 'border-no/50 bg-[#161616]'
                    : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      {getStatusBadge(alert.status)}
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-pill border border-bd bg-s2 text-t2">
                        {alert.alert_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[12px] font-mono text-t2 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(alert.created_at).toLocaleString()}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-1">
                      {alert.title}
                    </h3>

                    <p className="text-[14px] text-t2 leading-relaxed">
                      {alert.description}
                    </p>

                    {/* Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-2 text-[12px] pt-1">
                      {alert.product_name && (
                        <span className="px-3 py-0.5 rounded-pill border border-bd bg-s2 text-white font-mono flex items-center space-x-1.5">
                          <Package className="w-3.5 h-3.5 text-ac" />
                          <span>{alert.product_name} ({alert.sku})</span>
                        </span>
                      )}
                      {alert.order_id && (
                        <span className="px-3 py-0.5 rounded-pill border border-bd bg-s2 text-white font-mono">
                          Order #{alert.order_id} {alert.customer_name ? `(${alert.customer_name})` : ''}
                        </span>
                      )}
                      {alert.po_number && (
                        <span className="px-3 py-0.5 rounded-pill border border-bd bg-s2 text-white font-mono flex items-center space-x-1.5">
                          <Truck className="w-3.5 h-3.5 text-wa" />
                          <span>PO #{alert.po_number} ({alert.supplier_name})</span>
                        </span>
                      )}
                      {alert.metadata?.inventoryPosition !== undefined && (
                        <span className="px-3 py-0.5 rounded-pill border border-bd bg-s2 text-t2 font-mono">
                          Position: <strong className="text-white">{alert.metadata.inventoryPosition}</strong>
                        </span>
                      )}
                    </div>

                    {/* Recommended Action Box */}
                    <div className="mt-3 p-3.5 rounded-card border border-bd bg-s2 flex items-start space-x-2.5">
                      <ArrowRight className="w-4 h-4 text-ac flex-shrink-0 mt-0.5" />
                      <div className="text-[13px]">
                        <span className="font-mono text-ac text-[11px] block mb-0.5">
                          Recommended Action:
                        </span>
                        <span className="text-white">{alert.recommended_action}</span>
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
                            className="btn-header inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-[12px] font-bold text-wa border-wa/40 hover:bg-wa/10"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Acknowledge</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleResolve(alert.id)}
                          disabled={actionLoading[alert.id]}
                          className="btn-header inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-[12px] font-bold text-ok border-ok/40 hover:bg-ok/10"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      </>
                    )}

                    {alert.product_id && (
                      <Link
                        to="/admin/replenishment"
                        className="text-[12px] text-t2 hover:text-white underline flex items-center space-x-1 mt-1"
                      >
                        <span>Replenish</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Audit trail footer */}
                {(alert.acknowledged_at || alert.resolved_at) && (
                  <div className="mt-3 pt-2.5 border-t border-bd/40 text-[12px] font-mono text-t2 flex flex-wrap gap-4">
                    {alert.acknowledged_at && (
                      <span>
                        Acknowledged by <strong className="text-white">{alert.acknowledged_by_name || 'Admin'}</strong> on {new Date(alert.acknowledged_at).toLocaleTimeString()}
                      </span>
                    )}
                    {alert.resolved_at && (
                      <span>
                        Resolved by <strong className="text-white">{alert.resolved_by_name || 'Admin'}</strong> on {new Date(alert.resolved_at).toLocaleTimeString()}
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
