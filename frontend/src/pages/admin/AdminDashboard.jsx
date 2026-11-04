import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LogOut,
  ArrowRight,
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
            { name: 'Fulfilled', value: fulfilled, color: 'var(--ok)' },
            { name: 'Partial', value: partial, color: 'var(--wa)' },
            { name: 'Deferred', value: deferred, color: 'var(--no)' },
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
      {/* Page Header: Unbordered plain background as required by Step 2 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <span className="text-[12px] text-ac font-medium mb-1 block">
            Admin console <span className="sr-only">· Admin Operations Command</span>
          </span>
          <h1 className="text-[34px] font-display font-bold tracking-[-0.02em] text-t">
            Operations overview
          </h1>
          <p className="text-[14px] text-t2 mt-0.5 font-sans">
            {user?.email || 'admin@orderwise.com'} · {user?.role === 'admin' ? 'Admin' : 'Inventory Manager'}
          </p>
        </div>

        {/* Header buttons: secondary with #555 border */}
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

      {/* KPI Row: 4 columns, gap 16px. Clean uniform style, Inter Tight 700 value */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="card-base flex flex-col justify-between p-6">
          <span className="text-[13px] font-medium text-t2">Active Catalog</span>
          <div className="text-[34px] font-display font-bold text-t tracking-[-0.02em] my-1">
            {stats.productCount}
          </div>
          <span className="text-[12px] font-sans text-t2">SKUs monitored</span>
        </div>

        {/* KPI 2 */}
        <div className="card-base flex flex-col justify-between p-6">
          <span className="text-[13px] font-medium text-t2">Customer Orders</span>
          <div className="text-[34px] font-display font-bold text-t tracking-[-0.02em] my-1">
            {stats.orderCount}
          </div>
          <span className="text-[12px] font-sans text-t2">Active demand pipeline</span>
        </div>

        {/* KPI 3 */}
        <div className="card-base flex flex-col justify-between p-6">
          <span className="text-[13px] font-medium text-t2">Total On-Hand</span>
          <div className="text-[34px] font-display font-bold text-t tracking-[-0.02em] my-1">
            {stats.totalOnHand} <span className="text-[14px] text-t2 font-normal font-sans">units</span>
          </div>
          <span className="text-[12px] text-t2">Warehouse inventory</span>
        </div>

        {/* KPI 4: Alert variant uses subtle amber tint (#2B2010) only, no harsh borders */}
        <div className="bg-alert-bg border border-alert-border rounded-card p-6 flex flex-col justify-between">
          <span className="text-[13px] font-medium text-wa">Unresolved alerts</span>
          <div className="text-[34px] font-display font-bold text-t tracking-[-0.02em] my-1">
            {stats.unresolvedAlerts}
          </div>
          <span className="text-[12px] text-wa">Needs review</span>
        </div>
      </div>

      {/* Charts Section: 1.6fr / 1fr, gap 16px */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* Left: Stock vs Reserved Allocation Bar Chart */}
        <div className="card-base space-y-4">
          <div className="flex items-center justify-between border-b border-bd pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-ac" />
              <h2 className="text-[20px] font-display font-bold text-t">
                Stock vs reserved by SKU
              </h2>
            </div>
            {/* Legend: On Hand in --ac (#E50914), Reserved in series (#8A8A8A) */}
            <div className="flex items-center space-x-4 text-[12px] text-t2">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-ac inline-block" />
                <span className="text-t">On hand</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-series inline-block" />
                <span>Reserved</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockDemandChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="sku" stroke="var(--t2)" fontSize={12} tickLine={false} fontFamily="JetBrains Mono, monospace" />
                <YAxis stroke="var(--t2)" fontSize={12} tickLine={false} fontFamily="Inter, sans-serif" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--s)',
                    borderColor: 'var(--bd)',
                    borderRadius: '8px',
                    color: 'var(--t)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                  }}
                />
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
                <h2 className="text-[20px] font-display font-bold text-t">
                  Allocation outcomes
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
                        backgroundColor: 'var(--s)',
                        borderColor: 'var(--bd)',
                        borderRadius: '8px',
                        color: 'var(--t)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Total orders centered in the middle of donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[34px] font-display font-bold text-t leading-none">
                    {totalAllocatedItems}
                  </span>
                  <span className="text-[12px] text-t2 mt-1">orders</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-[13px] text-t2 text-center">
                Run the allocation engine to generate outcome metrics.
              </div>
            )}
          </div>

          {/* Clean Horizontal Legend directly below matching Admin dashboard.png */}
          <div className="border-t border-bd pt-3 flex items-center justify-around text-center text-[12px] text-t2">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-ok inline-block" />
              <span className="text-t">Fulfilled {allocationSummaryData.find((d) => d.name === 'Fulfilled')?.value || 0}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-wa inline-block" />
              <span className="text-t">Partial {allocationSummaryData.find((d) => d.name === 'Partial')?.value || 0}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-no inline-block" />
              <span className="text-t">Deferred {allocationSummaryData.find((d) => d.name === 'Deferred')?.value || 0}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Modules row: 4 columns, gap 16px */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-[24px] font-display font-bold tracking-tight text-t">
            Modules
          </h2>
          <div className="w-10 h-[3px] bg-ac mt-2 mb-3 rounded-full" />
        </div>

        {/* Module cards: Title, description, and Active indicator matching Image 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Module 1: Allocation center */}
          <Link
            to="/admin/allocation"
            className="card-base hover:border-ac transition-colors group flex flex-col justify-between space-y-3 p-6"
          >
            <div>
              <span className="font-mono text-[12px] text-ok mb-2 block font-medium">● Active</span>
              <div className="flex items-start justify-between">
                <h3 className="text-[18px] font-display font-bold text-t group-hover:text-t">
                  Allocation Center
                </h3>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac transition-colors shrink-0 mt-1" />
              </div>
              <p className="text-[14px] text-t2 leading-normal mt-1">
                Run the engine and review run history.
              </p>
            </div>
          </Link>

          {/* Module 2: Product management */}
          <Link
            to="/admin/products"
            className="card-base hover:border-ac transition-colors group flex flex-col justify-between space-y-3 p-6"
          >
            <div>
              <span className="font-mono text-[12px] text-ok mb-2 block font-medium">● Active</span>
              <div className="flex items-start justify-between">
                <h3 className="text-[18px] font-display font-bold text-t group-hover:text-t">
                  Product Management
                </h3>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac transition-colors shrink-0 mt-1" />
              </div>
              <p className="text-[14px] text-t2 leading-normal mt-1">
                Catalog, SKUs and lifecycle controls.
              </p>
            </div>
          </Link>

          {/* Module 3: Inventory hub */}
          <Link
            to="/admin/inventory"
            className="card-base hover:border-ac transition-colors group flex flex-col justify-between space-y-3 p-6"
          >
            <div>
              <span className="font-mono text-[12px] text-ok mb-2 block font-medium">● Active</span>
              <div className="flex items-start justify-between">
                <h3 className="text-[18px] font-display font-bold text-t group-hover:text-t">
                  Inventory Hub
                </h3>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac transition-colors shrink-0 mt-1" />
              </div>
              <p className="text-[14px] text-t2 leading-normal mt-1">
                Stock levels, buffers and audit ledger.
              </p>
            </div>
          </Link>

          {/* Module 4: Order management */}
          <Link
            to="/admin/orders"
            className="card-base hover:border-ac transition-colors group flex flex-col justify-between space-y-3 p-6"
          >
            <div>
              <span className="font-mono text-[12px] text-ok mb-2 block font-medium">● Active</span>
              <div className="flex items-start justify-between">
                <h3 className="text-[18px] font-display font-bold text-t group-hover:text-t">
                  Order Management
                </h3>
                <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac transition-colors shrink-0 mt-1" />
              </div>
              <p className="text-[14px] text-t2 leading-normal mt-1">
                Inspect orders and enforce priority.
              </p>
            </div>
          </Link>
        </div>

        {/* Roadmap card: dashed border matching Image 4 */}
        <div className="card-roadmap p-4 flex flex-wrap items-center gap-4">
          <span className="font-mono text-[12px] text-t font-semibold">Roadmap</span>
          <span className="text-[14px] text-t2 font-sans">
            Simulation lab · Supply alerts · Replenishment advisor · AI priorities · Impact analyzer · Executive reports
          </span>
        </div>
      </div>
    </div>
  );
}
