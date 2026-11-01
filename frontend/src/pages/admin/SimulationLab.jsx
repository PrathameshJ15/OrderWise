import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Play,
  RefreshCw,
  Layers,
  Cpu,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  ShieldCheck,
  Package,
} from 'lucide-react';
import apiClient from '../../api/client';
import StatusPill from '../../components/ui/StatusPill';

const SCENARIOS = [
  {
    type: 'inventory_increase',
    name: 'Inventory Receipt Surge',
    desc: 'Simulate receipt of additional physical warehouse stock for a target product SKU.',
  },
  {
    type: 'inventory_decrease',
    name: 'Stock Shrinkage / Damage',
    desc: 'Model inventory shrinkage, physical defect discard, or warehouse losses.',
  },
  {
    type: 'demand_surge',
    name: 'Market Demand Surge',
    desc: 'Apply a percentage demand spike across all eligible customer order quantities.',
  },
  {
    type: 'supplier_delay',
    name: 'Supplier Shipment Delay',
    desc: 'Evaluate downstream fulfillment impact if incoming purchase orders are delayed.',
  },
  {
    type: 'priority_change',
    name: 'VIP Priority Escalation',
    desc: 'Test what happens if a specific customer order is upgraded or downgraded in priority rank.',
  },
];

export default function SimulationLab() {
  const [selectedScenario, setSelectedScenario] = useState('inventory_increase');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [activeResult, setActiveResult] = useState(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  // Scenario inputs
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [surgePercent, setSurgePercent] = useState(25);
  const [delayDays, setDelayDays] = useState(7);
  const [orderId, setOrderId] = useState('');
  const [hypotheticalPriority, setHypotheticalPriority] = useState('CRITICAL');

  const fetchContextData = useCallback(async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      const [prodRes, ordRes, simRes] = await Promise.all([
        apiClient.get('/products?active=true'),
        apiClient.get('/orders'),
        apiClient.get('/simulations'),
      ]);

      const pList = prodRes.data || [];
      const oList = ordRes.data || [];
      const sList = simRes.data?.simulations || simRes.data || [];

      setProducts(pList);
      setOrders(oList);
      setSimulations(sList);

      if (pList.length > 0) setProductId(pList[0].id);
      if (oList.length > 0) setOrderId(oList[0].id);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to load simulation environment.');
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    fetchContextData();
  }, [fetchContextData]);

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    setRunning(true);
    setError(null);

    const payload = {
      scenario_type: selectedScenario,
      name: `${selectedScenario.toUpperCase()} Experiment`,
      description: `In-memory simulation run at ${new Date().toLocaleTimeString()}`,
      save_record: true,
      scenario_inputs: {},
    };

    if (selectedScenario === 'inventory_increase' || selectedScenario === 'inventory_decrease') {
      payload.scenario_inputs = {
        product_id: Number(productId),
        quantity: Number(quantity),
      };
    } else if (selectedScenario === 'demand_surge') {
      payload.scenario_inputs = {
        surge_percent: Number(surgePercent),
      };
    } else if (selectedScenario === 'supplier_delay') {
      payload.scenario_inputs = {
        delay_days: Number(delayDays),
      };
    } else if (selectedScenario === 'priority_change') {
      payload.scenario_inputs = {
        order_id: Number(orderId),
        hypothetical_priority: hypotheticalPriority,
      };
    }

    try {
      const res = await apiClient.post('/simulations', payload);
      setActiveResult(res.data);
      // Refresh list
      const updatedSims = await apiClient.get('/simulations');
      setSimulations(updatedSims.data?.simulations || updatedSims.data || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Simulation execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const diffSummary = activeResult?.diff?.summary || activeResult?.diff || null;
  const itemDiffs = activeResult?.diff?.item_diffs || activeResult?.diff?.differences || [];

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <FlaskConical className="h-3 w-3" />
            <span>WHAT-IF SCENARIO EXPERIMENTATION LAB</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Simulation Lab
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Test inventory changes, demand spikes, and priority shifts in-memory without mutating live database records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/impact"
            className="flex items-center space-x-1.5 px-3 py-2 border border-arcade-border text-arcade-primary hover:border-arcade-accent hover:text-arcade-accent text-xs uppercase tracking-wider transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-arcade-accent" />
            <span>Impact Analyzer</span>
          </Link>
          <Link
            to="/admin/allocation"
            className="flex items-center space-x-1.5 px-3 py-2 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_8px_rgba(200,255,58,0.2)]"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Allocation Center &rarr;</span>
          </Link>
        </div>
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

      {/* Safety Notice */}
      <div className="border border-arcade-accent/30 bg-arcade-accent/5 p-4 flex items-start space-x-3 text-xs">
        <ShieldCheck className="h-4 w-4 text-arcade-accent shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-arcade-accent uppercase tracking-wider block">
            In-Memory Sandboxed Execution Guarantee
          </span>
          <p className="text-arcade-secondary leading-relaxed">
            All simulations copy current live inventory balances and confirmed order queues into isolated worker memory.
            The deterministic allocation algorithm executes against simulated state and produces mathematical diffs
            without altering live database tables.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Select & Configure Scenario */}
        <div className="border border-arcade-border bg-arcade-neutral p-5 lg:col-span-1 space-y-4">
          <h2 className="font-display text-sm uppercase font-bold text-arcade-primary border-b border-arcade-border pb-2">
            Configure What-If Model
          </h2>

          <form onSubmit={handleRunSimulation} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
                Scenario Type
              </label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full bg-arcade-surface border border-arcade-border px-3 py-2 text-xs text-arcade-primary focus:outline-none focus:border-arcade-accent"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.type} value={s.type}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-arcade-secondary mt-1">
                {SCENARIOS.find((s) => s.type === selectedScenario)?.desc}
              </p>
            </div>

            {/* Dynamic Inputs per Scenario */}
            {(selectedScenario === 'inventory_increase' || selectedScenario === 'inventory_decrease') && (
              <>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
                    Target Product SKU
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full bg-arcade-surface border border-arcade-border px-3 py-2 text-xs text-arcade-primary focus:outline-none focus:border-arcade-accent"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
                    Quantity Delta Units ({selectedScenario === 'inventory_increase' ? '+Add' : '-Subtract'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-arcade-surface border border-arcade-border px-3 py-2 text-xs text-arcade-primary focus:outline-none focus:border-arcade-accent"
                  />
                </div>
              </>
            )}

            {selectedScenario === 'demand_surge' && (
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
                  Demand Surge (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={surgePercent}
                  onChange={(e) => setSurgePercent(e.target.value)}
                  className="w-full bg-arcade-surface border border-arcade-border px-3 py-2 text-xs text-arcade-primary focus:outline-none focus:border-arcade-accent"
                />
                <span className="text-[10px] text-arcade-secondary mt-1 block">
                  All active order item quantities will be scaled up by this ratio.
                </span>
              </div>
            )}

            {selectedScenario === 'supplier_delay' && (
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
                  Delay Inbound POs (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={delayDays}
                  onChange={(e) => setDelayDays(e.target.value)}
                  className="w-full bg-arcade-surface border border-arcade-border px-3 py-2 text-xs text-arcade-primary focus:outline-none focus:border-arcade-accent"
                />
              </div>
            )}

            {selectedScenario === 'priority_change' && (
              <>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
                    Target Order
                  </label>
                  <select
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full bg-arcade-surface border border-arcade-border px-3 py-2 text-xs text-arcade-primary focus:outline-none focus:border-arcade-accent"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.id} — Customer #{o.customer_id} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-arcade-secondary mb-1">
                    Hypothetical Priority Rank
                  </label>
                  <select
                    value={hypotheticalPriority}
                    onChange={(e) => setHypotheticalPriority(e.target.value)}
                    className="w-full bg-arcade-surface border border-arcade-border px-3 py-2 text-xs text-arcade-primary focus:outline-none focus:border-arcade-accent"
                  >
                    <option value="CRITICAL">CRITICAL (Tier 4)</option>
                    <option value="HIGH">HIGH (Tier 3)</option>
                    <option value="MEDIUM">MEDIUM (Tier 2)</option>
                    <option value="LOW">LOW (Tier 1)</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={running}
              className="w-full bg-arcade-accent text-arcade-surface font-extrabold text-xs uppercase tracking-wider py-3 flex items-center justify-center space-x-2 hover:opacity-95 transition-opacity disabled:opacity-50 shadow-[0_0_12px_rgba(200,255,58,0.25)]"
            >
              {running ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Computing In-Memory Model...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output: Simulation Outcomes & Telemetry */}
        <div className="border border-arcade-border bg-arcade-neutral p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-arcade-border pb-3">
            <h2 className="font-display text-sm uppercase font-bold text-arcade-primary">
              Simulation Outcomes &amp; Delta Telemetry
            </h2>
            {activeResult && (
              <span className="text-[10px] uppercase tracking-wider text-arcade-accent font-bold">
                Status: Completed Successfully
              </span>
            )}
          </div>

          {!activeResult ? (
            <div className="p-12 text-center text-arcade-secondary space-y-3">
              <FlaskConical className="h-10 w-10 text-arcade-secondary mx-auto opacity-40" />
              <div className="text-sm font-bold text-arcade-primary uppercase">No Active Simulation</div>
              <p className="text-xs max-w-md mx-auto">
                Configure your scenario parameters on the left and click &ldquo;Run Simulation&rdquo; to model the downstream fulfillment effects.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border border-arcade-border bg-arcade-surface p-3">
                  <span className="text-[10px] text-arcade-secondary uppercase block">Items Evaluated</span>
                  <span className="text-xl font-bold text-arcade-primary">
                    {diffSummary?.total_items_compared || diffSummary?.total_evaluated || itemDiffs.length || 0}
                  </span>
                </div>
                <div className="border border-arcade-border bg-arcade-surface p-3">
                  <span className="text-[10px] text-arcade-secondary uppercase block">Items Changed</span>
                  <span className="text-xl font-bold text-arcade-accent">
                    {diffSummary?.total_changed || diffSummary?.changed_items || 0}
                  </span>
                </div>
                <div className="border border-arcade-border bg-arcade-surface p-3">
                  <span className="text-[10px] text-emerald-400 uppercase block">Improvements</span>
                  <span className="text-xl font-bold text-emerald-400 flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{diffSummary?.improvements || 0}</span>
                  </span>
                </div>
                <div className="border border-arcade-border bg-arcade-surface p-3">
                  <span className="text-[10px] text-arcade-danger uppercase block">Degradations</span>
                  <span className="text-xl font-bold text-arcade-danger flex items-center space-x-1">
                    <TrendingDown className="h-4 w-4" />
                    <span>{diffSummary?.degradations || 0}</span>
                  </span>
                </div>
              </div>

              {/* Items Diff Table */}
              <div className="border border-arcade-border bg-arcade-surface overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-arcade-border bg-arcade-neutral text-arcade-secondary uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3 text-right">Requested</th>
                      <th className="py-2 px-3 text-right">Live Allocated</th>
                      <th className="py-2 px-3 text-right">Simulated</th>
                      <th className="py-2 px-3 text-right">Delta</th>
                      <th className="py-2 px-3 text-center">Simulated Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arcade-border/50">
                    {itemDiffs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-6 text-center text-arcade-secondary text-xs">
                          No allocation differences between current state and simulated scenario.
                        </td>
                      </tr>
                    ) : (
                      itemDiffs.map((diff, idx) => (
                        <tr key={idx} className="hover:bg-arcade-neutral/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-arcade-primary">#{diff.order_id}</td>
                          <td className="py-2.5 px-3 text-arcade-secondary truncate max-w-[150px]">
                            {diff.product_name || `Product #${diff.product_id}`}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-arcade-primary">
                            {diff.requested_quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-arcade-secondary">
                            {diff.previous_allocated ?? diff.live_allocated ?? 0}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-arcade-primary">
                            {diff.current_allocated ?? diff.simulated_allocated ?? 0}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono font-bold ${
                              (diff.delta || 0) > 0
                                ? 'text-emerald-400'
                                : (diff.delta || 0) < 0
                                ? 'text-arcade-danger'
                                : 'text-arcade-secondary'
                            }`}
                          >
                            {(diff.delta || 0) > 0 ? `+${diff.delta}` : diff.delta || 0}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <StatusPill status={diff.current_status || diff.simulated_status || 'fulfilled'} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Past Simulations History */}
      <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-4">
        <div className="flex items-center space-x-2 border-b border-arcade-border pb-3">
          <History className="h-4 w-4 text-arcade-accent" />
          <h3 className="font-display text-sm uppercase font-bold text-arcade-primary">
            Saved Simulation Runs History ({simulations.length})
          </h3>
        </div>

        {simulations.length === 0 ? (
          <div className="p-6 text-center text-xs text-arcade-secondary">
            No simulation runs saved in the audit log yet.
          </div>
        ) : (
          <div className="border border-arcade-border bg-arcade-surface overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-arcade-border bg-arcade-neutral text-arcade-secondary uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Run ID</th>
                  <th className="py-2.5 px-3">Scenario Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Executed At</th>
                  <th className="py-2.5 px-3 text-right">Items Changed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-arcade-border/50">
                {simulations.slice(0, 10).map((sim) => (
                  <tr key={sim.id} className="hover:bg-arcade-neutral/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-arcade-primary">#{sim.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-arcade-primary">{sim.name || 'Simulation'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 border border-arcade-border bg-arcade-neutral text-[10px] uppercase font-bold text-arcade-accent">
                        {sim.scenario_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-arcade-secondary">
                      {new Date(sim.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-arcade-accent">
                      {sim.diff?.summary?.total_changed ?? sim.diff?.changed_items ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
