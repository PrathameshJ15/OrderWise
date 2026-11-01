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
  FlaskConical,
  Sparkles,
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
            { name: 'Fulfilled', value: fulfilled, color: '#4ADE80' },
            { name: 'Partial', value: partial, color: '#F5B544' },
            { name: 'Deferred', value: deferred, color: '#FF7A7A' },
          ]);
        } catch {
          // Fallback
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

  const totalAllocatedItems = allocationSummaryData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="space-y-6 font-sans py-2">
      {/* Admin Header Card: radius 14px, 1px border, no shadow */}
      <div className="card-base flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[12px] font-mono text-ac font-medium mb-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Operations Command Center</span>
          </div>
          {/* Dashboard H1: 34px, tracking -0.02em, 700. Sentence case */}
          <h1 className="text-[34px] font-bold tracking-[-0.02em] text-white">
            Admin console: {user?.name || 'Administrator'}
          </h1>
          <p className="text-[14px] text-t2 mt-0.5 font-sans">
            Logged in as {user?.email} • Authority level: <span className="font-mono text-ac font-medium">{user?.role}</span>
          </p>
        </div>

        {/* Header buttons (Refresh, Log out): secondary with #555 border */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-header space-x-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={logout}
            className="btn-header space-x-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* KPI Row: 4 columns, gap 16px. Small label, 34px value, mono caption. Alert variant uses amber label and alert-bg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="card-base flex flex-col justify-between">
          <div className="flex items-center justify-between text-t2 mb-1">
            <span className="text-[12px] font-mono font-medium">Active Catalog</span>
            <Package className="h-4 w-4 text-t2" />
          </div>
          <div className="text-[34px] font-bold text-white tracking-tight my-1">
            {stats.productCount}
          </div>
          <span className="text-[12px] font-mono text-t2">Monitored hardware SKUs</span>
        </div>

        {/* KPI 2 */}
        <div className="card-base flex flex-col justify-between">
          <div className="flex items-center justify-between text-t2 mb-1">
            <span className="text-[12px] font-mono font-medium">Customer Orders</span>
            <ShoppingBag className="h-4 w-4 text-t2" />
          </div>
          <div className="text-[34px] font-bold text-white tracking-tight my-1">
            {stats.orderCount}
          </div>
          <span className="text-[12px] font-mono text-t2">Demand submissions</span>
        </div>

        {/* KPI 3 */}
        <div className="card-base flex flex-col justify-between">
          <div className="flex items-center justify-between text-t2 mb-1">
            <span className="text-[12px] font-mono font-medium">Total On-Hand</span>
            <Database className="h-4 w-4 text-t2" />
          </div>
          <div className="text-[34px] font-bold text-white tracking-tight my-1">
            {stats.totalOnHand} <span className="text-[14px] text-t2 font-normal">units</span>
          </div>
          <span className="text-[12px] font-mono text-t2">Physical warehouse inventory</span>
        </div>

        {/* KPI 4: Alert variant uses amber label and alert-bg / alert-border */}
        <div className="bg-alert-bg border border-alert-border rounded-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-wa mb-1">
            <span className="text-[12px] font-mono font-medium">Unresolved Alerts</span>
            <AlertTriangle className="h-4 w-4 text-wa" />
          </div>
          <div className="text-[34px] font-bold text-white tracking-tight my-1">
            {stats.unresolvedAlerts}
          </div>
          <span className="text-[12px] font-mono text-wa/80">Pending telemetry warnings</span>
        </div>
      </div>

      {/* Orders by status row */}
      {orderStatusChartData.length > 0 && (
        <div className="card-base flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4 text-ac" />
            <span className="text-[14px] font-bold text-white">Orders by status:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {orderStatusChartData.map((item) => (
              <span
                key={item.status}
                className="px-3 py-1 rounded-pill text-[12px] font-mono border border-bd bg-s2 flex items-center space-x-1.5"
              >
                <span className="text-t2 capitalize">{item.status}:</span>
                <span className="font-semibold text-white">{item.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section: 1.6fr / 1fr, gap 16px */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* Left: Stock vs Reserved Allocation Bar Chart */}
        <div className="card-base space-y-4">
          <div className="flex items-center justify-between border-b border-bd pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-ac" />
              {/* Section H2: 24px (dashboard) */}
              <h2 className="text-[20px] font-bold text-white">
                Stock vs reserved allocation by SKU
              </h2>
            </div>
            {/* Legend: On Hand in --ac (#E50914), Reserved in series (#8A8A8A) */}
            <div className="flex items-center space-x-4 text-[12px] font-mono text-t2">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-ac inline-block" />
                <span className="text-white">On hand</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-series inline-block" />
                <span>Reserved</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockDemandChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="sku" stroke="#A8A8A8" fontSize={12} tickLine={false} fontFamily="IBM Plex Mono" />
                <YAxis stroke="#A8A8A8" fontSize={12} tickLine={false} fontFamily="IBM Plex Mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161616',
                    borderColor: '#2A2A2A',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '12px',
                  }}
                />
                {/* Bars: 4px top radius */}
                <Bar dataKey="onHand" fill="#E50914" name="On hand" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reserved" fill="#8A8A8A" name="Reserved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Donut Chart: ring width 12, total orders centered, legend directly below */}
        <div className="card-base space-y-4 flex flex-col justify-between" aria-label="Order allocation distribution">
          <div>
            <div className="flex items-center justify-between border-b border-bd pb-3 mb-2">
              <div className="flex items-center space-x-2">
                <PieIcon className="h-4 w-4 text-ac" />
                <h2 className="text-[20px] font-bold text-white">
                  Allocation engine outcomes
                </h2>
              </div>
            </div>

            {allocationSummaryData.length > 0 ? (
              <div className="relative h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart aria-label="Allocation outcomes donut">
                    <Pie
                      data={allocationSummaryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {allocationSummaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161616',
                        borderColor: '#2A2A2A',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontFamily: 'IBM Plex Mono',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Total orders centered in the middle of donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[26px] font-bold text-white leading-none">
                    {totalAllocatedItems}
                  </span>
                  <span className="text-[11px] font-mono text-t2 mt-1">Total items</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-[13px] text-t2 text-center">
                Run the allocation engine to generate outcome metrics.
              </div>
            )}
          </div>

          {/* Legend directly below */}
          <div className="border-t border-bd pt-3 flex justify-around text-center text-xs">
            <div>
              <span className="text-[12px] font-mono text-ok font-medium block">Fulfilled</span>
              <span className="text-[18px] font-bold text-white">
                {allocationSummaryData.find((d) => d.name === 'Fulfilled')?.value || 0}
              </span>
            </div>
            <div>
              <span className="text-[12px] font-mono text-wa font-medium block">Partial</span>
              <span className="text-[18px] font-bold text-white">
                {allocationSummaryData.find((d) => d.name === 'Partial')?.value || 0}
              </span>
            </div>
            <div>
              <span className="text-[12px] font-mono text-no font-medium block">Deferred</span>
              <span className="text-[18px] font-bold text-white">
                {allocationSummaryData.find((d) => d.name === 'Deferred')?.value || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules row: 4 columns, gap 16px */}
      <div className="space-y-4">
        <div className="border-b border-bd pb-2">
          <h2 className="text-[24px] font-bold tracking-tight text-white">
            Operations command modules
          </h2>
        </div>

        {/* Module cards: "Active" mono label in --ok, title, one-line description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Module 1: Allocation Center */}
          <Link
            to="/admin/allocation"
            className="card-base hover:border-white transition-colors group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-mono font-medium text-ok">Active</span>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-[18px] font-bold text-white">Allocation Center</h3>
            </div>
            <p className="text-[14px] text-t2 leading-normal">
              Deterministic priority-based allocation engine with live execution.
            </p>
          </Link>

          {/* Module 2: Product Management */}
          <Link
            to="/admin/products"
            className="card-base hover:border-white transition-colors group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-mono font-medium text-ok">Active</span>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-[18px] font-bold text-white">Product Management</h3>
            </div>
            <p className="text-[14px] text-t2 leading-normal">
              Catalog creation, hardware updates, SKU definitions, and lifecycle controls.
            </p>
          </Link>

          {/* Module 3: Inventory Hub */}
          <Link
            to="/admin/inventory"
            className="card-base hover:border-white transition-colors group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-mono font-medium text-ok">Active</span>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-[18px] font-bold text-white">Inventory Hub</h3>
            </div>
            <p className="text-[14px] text-t2 leading-normal">
              Manage on-hand quantities, safety buffers, concurrency, and audit logs.
            </p>
          </Link>

          {/* Module 4: Order Management */}
          <Link
            to="/admin/orders"
            className="card-base hover:border-white transition-colors group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-mono font-medium text-ok">Active</span>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-[18px] font-bold text-white">Order Management</h3>
            </div>
            <p className="text-[14px] text-t2 leading-normal">
              Filter and inspect customer orders, confirm states, and enforce priorities.
            </p>
          </Link>
        </div>

        {/* Upcoming modules collapsed into one dashed "Roadmap" row */}
        <div className="card-roadmap flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[12px] font-mono text-t2 uppercase tracking-wide">Roadmap</span>
              <span className="text-[12px] font-mono text-t2">• Advanced intelligence modules</span>
            </div>
            <h4 className="text-[18px] font-bold text-white mt-1">
              Simulation Lab, Groq Llama-3 priorities, and replenishment advisory
            </h4>
            <p className="text-[14px] text-t2 mt-0.5">
              What-if scenario sandboxes, automated stockout alerts, and demand velocity reorder recommendations.
            </p>
          </div>
          <div className="text-[12px] font-mono text-t2 shrink-0">
            Roadmap view
          </div>
        </div>
      </div>
    </div>
  );
}
