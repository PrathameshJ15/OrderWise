import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Cpu,
  ShieldCheck,
  Database,
  Layers,
  LogOut,
  AlertTriangle,
  Truck,
  ArrowRight,
  Package,
  ShoppingBag,
  RefreshCw,
  BarChart3,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import apiClient from '../../api/client';
import Badge from '../../components/ui/Badge';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    productCount: 0,
    orderCount: 0,
    totalOnHand: 0,
    totalDemand: 0,
    unresolvedAlerts: 0,
  });

  const [stockDemandChartData, setStockDemandChartData] = useState([]);
  const [orderStatusChartData, setOrderStatusChartData] = useState([]);
  const [allocationSummaryData, setAllocationSummaryData] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, inventoryRes, alertsRes, runsRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/orders'),
        apiClient.get('/inventory'),
        apiClient.get('/alerts?resolved=false'),
        apiClient.get('/allocation/runs'),
      ]);

      const productList = productsRes.data || [];
      const orderList = ordersRes.data || [];
      const inventoryList = inventoryRes.data || [];
      const alertList = alertsRes.data?.alerts || [];
      const pastRuns = runsRes.data || [];

      // 1. Stock vs Demand Chart Data
      const stockDemand = inventoryList.map((inv) => ({
        sku: inv.sku || `P-${inv.product_id}`,
        name: inv.product_name,
        onHand: Number(inv.on_hand_quantity || 0),
        reserved: Number(inv.reserved_quantity || 0),
        available: Math.max(0, Number(inv.on_hand_quantity) - Number(inv.reserved_quantity)),
      }));
      setStockDemandChartData(stockDemand);

      // 2. Orders by Status Data
      const statusCounts = {};
      orderList.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });
      const orderStatusData = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.replace(/_/g, ' '),
        count,
      }));
      setOrderStatusChartData(orderStatusData);

      // 3. Allocation Outcomes Data (from latest run if available)
      if (pastRuns.length > 0) {
        const latestRunId = pastRuns[0].id;
        try {
          const runDetails = await apiClient.get(`/allocation/runs/${latestRunId}`);
          const results = runDetails.data?.results || [];
          const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
          const partial = results.filter((r) => r.status === 'partially_fulfilled').length;
          const deferred = results.filter((r) => r.status === 'deferred').length;

          setAllocationSummaryData([
            { name: 'Fulfilled', value: fulfilled, color: '#c8ff3a' },
            { name: 'Partial', value: partial, color: '#f59e0b' },
            { name: 'Deferred', value: deferred, color: '#ef4444' },
          ]);
        } catch {
          // Fallback demo summary
        }
      }

      // Compute Total Numbers
      const onHandSum = inventoryList.reduce((acc, i) => acc + Number(i.on_hand_quantity || 0), 0);
      const demandSum = orderList.reduce((acc, o) => acc + Number(o.total_requested_quantity || 0), 0);

      setStats({
        productCount: productList.length,
        orderCount: orderList.length,
        totalOnHand: onHandSum,
        totalDemand: demandSum,
        unresolvedAlerts: alertList.length,
      });
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Admin Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <ShieldCheck className="h-3 w-3" />
            <span>OPERATIONS COMMAND CENTER</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Admin Console: {user?.name || 'Administrator'}
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Logged in as {user?.email} • Authority Level: <span className="uppercase text-arcade-accent font-bold">{user?.role}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 border border-arcade-border text-arcade-secondary hover:text-arcade-primary text-xs uppercase tracking-wider transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-2 border border-arcade-border text-arcade-secondary hover:text-arcade-danger hover:border-arcade-danger text-xs uppercase tracking-wider transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Real KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary mb-1">
            <span className="text-[11px] uppercase tracking-wider">Active Catalog</span>
            <Package className="h-4 w-4 text-arcade-accent" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-primary">
            {stats.productCount}
          </div>
          <span className="text-[10px] text-arcade-secondary">Monitored hardware SKUs</span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary mb-1">
            <span className="text-[11px] uppercase tracking-wider">Customer Orders</span>
            <ShoppingBag className="h-4 w-4 text-arcade-accent" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-primary">
            {stats.orderCount}
          </div>
          <span className="text-[10px] text-arcade-secondary">Demand submissions</span>
        </div>

        <div className="border border-arcade-border bg-arcade-neutral p-4">
          <div className="flex items-center justify-between text-arcade-secondary mb-1">
            <span className="text-[11px] uppercase tracking-wider">Total On-Hand</span>
            <Database className="h-4 w-4 text-arcade-accent" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-primary">
            {stats.totalOnHand} <span className="text-xs text-arcade-secondary font-normal">units</span>
          </div>
          <span className="text-[10px] text-arcade-secondary">Physical warehouse inventory</span>
        </div>

        <div className="border border-arcade-warning/30 bg-arcade-warning/5 p-4">
          <div className="flex items-center justify-between text-arcade-warning mb-1">
            <span className="text-[11px] uppercase tracking-wider">Unresolved Alerts</span>
            <AlertTriangle className="h-4 w-4 text-arcade-warning" />
          </div>
          <div className="text-2xl font-display font-extrabold text-arcade-warning">
            {stats.unresolvedAlerts}
          </div>
          <span className="text-[10px] text-arcade-warning/80">Pending telemetry warnings</span>
        </div>
      </div>

      {/* Orders by Status Metrics */}
      {orderStatusChartData.length > 0 && (
        <div className="border border-arcade-border bg-arcade-neutral p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4 text-arcade-accent" />
            <span className="text-xs uppercase tracking-wider font-bold text-arcade-primary">Orders by Status:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {orderStatusChartData.map((item) => (
              <span
                key={item.status}
                className="px-2.5 py-1 text-xs border border-arcade-border bg-arcade-surface flex items-center space-x-1.5"
              >
                <span className="uppercase text-arcade-secondary">{item.status}:</span>
                <span className="font-bold text-arcade-accent">{item.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Visualizations Section: Stock vs Demand & Allocation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock vs Demand Bar Chart */}
        <div className="lg:col-span-2 border border-arcade-border bg-arcade-neutral p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-arcade-border pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-arcade-accent" />
              <h2 className="font-display text-base uppercase font-bold text-arcade-primary">
                Stock vs Reserved Allocation by SKU
              </h2>
            </div>
            <div className="flex items-center space-x-4 text-[10px] text-arcade-secondary">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-arcade-accent inline-block" />
                <span>On Hand</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-arcade-warning inline-block" />
                <span>Reserved</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockDemandChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="sku" stroke="#8a8f80" fontSize={11} tickLine={false} />
                <YAxis stroke="#8a8f80" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#11120f',
                    borderColor: '#22231e',
                    color: '#eef0e6',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="onHand" fill="#c8ff3a" name="On Hand" />
                <Bar dataKey="reserved" fill="#f59e0b" name="Reserved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Outcomes Breakdown */}
        <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-arcade-border pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <PieIcon className="h-4 w-4 text-arcade-accent" />
                <h2 className="font-display text-base uppercase font-bold text-arcade-primary">
                  Allocation Engine Outcomes
                </h2>
              </div>
            </div>

            {allocationSummaryData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationSummaryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {allocationSummaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#11120f',
                        borderColor: '#22231e',
                        color: '#eef0e6',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-arcade-secondary text-center">
                Run the allocation engine to generate outcome metrics.
              </div>
            )}
          </div>

          <div className="border-t border-arcade-border pt-3 flex justify-around text-center text-xs">
            <div>
              <span className="text-[10px] text-arcade-accent uppercase block">Fulfilled</span>
              <span className="font-bold text-arcade-primary">
                {allocationSummaryData.find((d) => d.name === 'Fulfilled')?.value || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-arcade-warning uppercase block">Partial</span>
              <span className="font-bold text-arcade-primary">
                {allocationSummaryData.find((d) => d.name === 'Partial')?.value || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-arcade-danger uppercase block">Deferred</span>
              <span className="font-bold text-arcade-primary">
                {allocationSummaryData.find((d) => d.name === 'Deferred')?.value || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Modules Navigation Grid with Badges */}
      <div>
        <h2 className="font-display text-lg uppercase font-bold text-arcade-primary mb-3">
          Operations Command Modules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Allocation Center */}
          <Link
            to="/admin/allocation"
            className="group border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/60 transition-all block relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center">
                <Cpu className="h-4 w-4" />
              </div>
              <Badge variant="active">Active Engine</Badge>
            </div>
            <h3 className="font-display text-lg uppercase font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors flex items-center justify-between">
              <span>Allocation Center</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-arcade-accent" />
            </h3>
            <p className="text-xs text-arcade-secondary mt-1 mb-4">
              Deterministic priority-based order allocation engine with live execution and run history.
            </p>
            <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
              Open Control Center &rarr;
            </span>
          </Link>

          {/* Product Management */}
          <Link
            to="/admin/products"
            className="group border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/60 transition-all block relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
              <Badge variant="active">Active Hub</Badge>
            </div>
            <h3 className="font-display text-lg uppercase font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors flex items-center justify-between">
              <span>Product Management</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-arcade-accent" />
            </h3>
            <p className="text-xs text-arcade-secondary mt-1 mb-4">
              Catalog creation, hardware updates, SKU definitions, and soft-delete lifecycle controls.
            </p>
            <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
              Manage Catalog &rarr;
            </span>
          </Link>

          {/* Inventory Management */}
          <Link
            to="/admin/inventory"
            className="group border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/60 transition-all block relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
              <Badge variant="active">Active Hub</Badge>
            </div>
            <h3 className="font-display text-lg uppercase font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors flex items-center justify-between">
              <span>Inventory Hub</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-arcade-accent" />
            </h3>
            <p className="text-xs text-arcade-secondary mt-1 mb-4">
              Manage on-hand quantities, safety buffers, optimistic concurrency, and audit ledger logs.
            </p>
            <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
              Manage Stock &rarr;
            </span>
          </Link>

          {/* Order Management */}
          <Link
            to="/admin/orders"
            className="group border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/60 transition-all block relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <Badge variant="active">Active Hub</Badge>
            </div>
            <h3 className="font-display text-lg uppercase font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors flex items-center justify-between">
              <span>Order Management</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-arcade-accent" />
            </h3>
            <p className="text-xs text-arcade-secondary mt-1 mb-4">
              Filter and inspect customer orders, confirm state transitions, and enforce priority ranks.
            </p>
            <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
              View Orders &rarr;
            </span>
          </Link>

          {/* Simulation Lab */}
          <Link
            to="/admin/simulations"
            className="group border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/60 transition-all block relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <Badge variant="active">Active Engine</Badge>
            </div>
            <h3 className="font-display text-lg uppercase font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors flex items-center justify-between">
              <span>Simulation Lab</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-arcade-accent" />
            </h3>
            <p className="text-xs text-arcade-secondary mt-1 mb-4">
              Run what-if scenario experiments (surges, shrinkage, delays) without mutating live data.
            </p>
            <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
              Experiment &rarr;
            </span>
          </Link>

          {/* Supply Alerts */}
          <Link
            to="/admin/alerts"
            className="group border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-warning/60 transition-all block relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-arcade-warning/10 text-arcade-warning flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <Badge variant="warning">Telemetry Live</Badge>
            </div>
            <h3 className="font-display text-lg uppercase font-bold text-arcade-primary group-hover:text-arcade-warning transition-colors flex items-center justify-between">
              <span>Supply Alerts</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-arcade-warning" />
            </h3>
            <p className="text-xs text-arcade-secondary mt-1 mb-4">
              Proactive diagnostic telemetry flagging stockouts, safety buffer breaches, and delayed POs.
            </p>
            <span className="text-[10px] uppercase tracking-wider text-arcade-warning font-bold">
              View Alerts &rarr;
            </span>
          </Link>

          {/* Replenishment Advisor */}
          <Link
            to="/admin/replenishment"
            className="group border border-arcade-border bg-arcade-neutral p-5 hover:border-arcade-accent/60 transition-all block relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-arcade-accent/10 text-arcade-accent flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
              <Badge variant="active">Active Engine</Badge>
            </div>
            <h3 className="font-display text-lg uppercase font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors flex items-center justify-between">
              <span>Replenishment Advisor</span>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-arcade-accent" />
            </h3>
            <p className="text-xs text-arcade-secondary mt-1 mb-4">
              Algorithmic reorder points and suggested replenishment orders based on demand velocity.
            </p>
            <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
              Advisor Models &rarr;
            </span>
          </Link>

          {/* AI Priority Review (Coming Soon) */}
          <div className="border border-arcade-border bg-arcade-neutral p-5 opacity-75 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-arcade-surface text-arcade-secondary flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <Badge variant="coming-soon">Coming Soon</Badge>
            </div>
            <h3 className="font-display text-lg uppercase font-bold text-arcade-secondary">
              AI Priority Review
            </h3>
            <p className="text-xs text-arcade-secondary mt-1 mb-4">
              Groq Llama-3 NLP recommendation assistant for customer business notes.
            </p>
            <span className="text-[10px] uppercase tracking-wider text-arcade-secondary font-semibold">
              Phase 12 Pipeline
            </span>
          </div>

          {/* Executive Reports (Coming Soon) */}
          <div className="border border-arcade-border bg-arcade-neutral p-5 opacity-75 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-arcade-surface text-arcade-secondary flex items-center justify-center">
                <BarChart3 className="h-4 w-4" />
              </div>
              <Badge variant="coming-soon">Coming Soon</Badge>
            </div>
            <h3 className="font-display text-lg uppercase font-bold text-arcade-secondary">
              Executive Reports
            </h3>
            <p className="text-xs text-arcade-secondary mt-1 mb-4">
              Cross-period fulfillment metrics, SLA violation analysis, and warehouse audits.
            </p>
            <span className="text-[10px] uppercase tracking-wider text-arcade-secondary font-semibold">
              Phase 13 Pipeline
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
