import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Play,
  RefreshCw,
  Layers,
  Cpu,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  History,
  ShieldCheck,
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
    <div className="space-y-6 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <FlaskConical className="h-3.5 w-3.5" />
            <span>WHAT-IF SCENARIO EXPERIMENTATION LAB</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            Simulation Lab
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5">
            Test inventory changes, demand spikes, and priority shifts in-memory without mutating live database records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/impact"
            className="btn-secondary min-h-[44px] px-4 text-[14px] flex items-center space-x-1.5"
          >
            <Layers className="h-4 w-4 text-ac" />
            <span>Impact Analyzer</span>
          </Link>
          <Link
            to="/admin/allocation"
            className="btn-primary flex items-center space-x-1.5 shadow-[0_6px_24px_rgba(229,9,20,0.4)]"
          >
            <Cpu className="h-4 w-4" />
            <span>Allocation Center &rarr;</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/40 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline hover:text-t text-[12px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Safety Notice */}
      <div className="rounded-card border border-bd bg-s2 p-4 flex items-start space-x-3 text-[13px]">
        <ShieldCheck className="h-5 w-5 text-ok shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-t block">
            In-Memory Sandboxed Execution Guarantee
          </span>
          <p className="text-t2 leading-relaxed">
            All simulations copy current live inventory balances and confirmed order queues into isolated worker memory.
            The deterministic allocation algorithm executes against simulated state and produces mathematical diffs
            without altering live database tables.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Select & Configure Scenario */}
        <div className="card-base lg:col-span-1 space-y-4">
          <h2 className="text-base font-bold text-t border-b border-bd pb-2">
            Configure What-If Model
          </h2>

          <form onSubmit={handleRunSimulation} className="space-y-4 text-[14px]">
            <div>
              <label className="block text-[13px] font-sans font-medium text-t2 mb-1.5">
                Scenario Type
              </label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t focus:outline-none focus:border-ac text-[14px]"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.type} value={s.type} className="bg-s text-t">
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="text-[12px] text-t2 mt-1">
                {SCENARIOS.find((s) => s.type === selectedScenario)?.desc}
              </p>
            </div>

            {/* Dynamic Inputs per Scenario */}
            {(selectedScenario === 'inventory_increase' || selectedScenario === 'inventory_decrease') && (
              <>
                <div>
                  <label className="block text-[13px] font-sans font-medium text-t2 mb-1.5">
                    Target Product SKU
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t focus:outline-none focus:border-ac text-[14px]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-s text-t">
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-sans font-medium text-t2 mb-1.5">
                    Quantity Delta Units ({selectedScenario === 'inventory_increase' ? '+Add' : '-Subtract'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t focus:outline-none focus:border-ac text-[14px]"
                  />
                </div>
              </>
            )}

            {selectedScenario === 'demand_surge' && (
              <div>
                <label className="block text-[13px] font-sans font-medium text-t2 mb-1.5">
                  Demand Surge (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={surgePercent}
                  onChange={(e) => setSurgePercent(e.target.value)}
                  className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t focus:outline-none focus:border-ac text-[14px]"
                />
                <span className="text-[12px] text-t2 mt-1 block">
                  All active order item quantities will be scaled up by this ratio.
                </span>
              </div>
            )}

            {selectedScenario === 'supplier_delay' && (
              <div>
                <label className="block text-[13px] font-sans font-medium text-t2 mb-1.5">
                  Delay Inbound POs (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={delayDays}
                  onChange={(e) => setDelayDays(e.target.value)}
                  className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t focus:outline-none focus:border-ac text-[14px]"
                />
              </div>
            )}

            {selectedScenario === 'priority_change' && (
              <>
                <div>
                  <label className="block text-[13px] font-sans font-medium text-t2 mb-1.5">
                    Target Order
                  </label>
                  <select
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t focus:outline-none focus:border-ac text-[14px]"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id} className="bg-s text-t">
                        #{o.id} — Customer #{o.customer_id} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-sans font-medium text-t2 mb-1.5">
                    Hypothetical Priority Rank
                  </label>
                  <select
                    value={hypotheticalPriority}
                    onChange={(e) => setHypotheticalPriority(e.target.value)}
                    className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t focus:outline-none focus:border-ac text-[14px]"
                  >
                    <option value="CRITICAL" className="bg-s text-t">CRITICAL (Tier 4)</option>
                    <option value="HIGH" className="bg-s text-t">HIGH (Tier 3)</option>
                    <option value="MEDIUM" className="bg-s text-t">MEDIUM (Tier 2)</option>
                    <option value="LOW" className="bg-s text-t">LOW (Tier 1)</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={running}
              className="btn-primary w-full py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
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
        <div className="card-base lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-bd pb-3">
            <h2 className="text-base font-bold text-t">
              Simulation Outcomes &amp; Delta Telemetry
            </h2>
            {activeResult && (
              <span className="text-[11px] font-mono text-ok font-semibold">
                Status: Completed Successfully
              </span>
            )}
          </div>

          {!activeResult ? (
            <div className="p-12 text-center text-t2 space-y-3">
              <FlaskConical className="h-10 w-10 text-t2 mx-auto opacity-30" />
              <div className="text-base font-bold text-t">No Active Simulation</div>
              <p className="text-[14px] max-w-md mx-auto">
                Configure your scenario parameters on the left and click &ldquo;Run Simulation&rdquo; to model the downstream fulfillment effects.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-card border border-bd bg-s2 p-3.5">
                  <span className="text-[11px] font-mono text-t2 block">Items Evaluated</span>
                  <span className="text-xl font-mono font-bold text-t mt-1 block">
                    {diffSummary?.total_items_compared || diffSummary?.total_evaluated || itemDiffs.length || 0}
                  </span>
                </div>
                <div className="rounded-card border border-bd bg-s2 p-3.5">
                  <span className="text-[11px] font-mono text-t2 block">Items Changed</span>
                  <span className="text-xl font-mono font-bold text-ac mt-1 block">
                    {diffSummary?.total_changed || diffSummary?.changed_items || 0}
                  </span>
                </div>
                <div className="rounded-card border border-ok/30 bg-s2 p-3.5">
                  <span className="text-[11px] font-mono text-ok block">Improvements</span>
                  <span className="text-xl font-mono font-bold text-ok flex items-center space-x-1 mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{diffSummary?.improvements || 0}</span>
                  </span>
                </div>
                <div className="rounded-card border border-no/30 bg-s2 p-3.5">
                  <span className="text-[11px] font-mono text-no block">Degradations</span>
                  <span className="text-xl font-mono font-bold text-no flex items-center space-x-1 mt-1">
                    <TrendingDown className="h-4 w-4" />
                    <span>{diffSummary?.degradations || 0}</span>
                  </span>
                </div>
              </div>

              {/* Items Diff Table */}
              <div className="rounded-card border border-bd overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px] border-collapse">
                    <thead>
                      <tr className="border-b border-bd bg-s2/60 text-t2 text-[12px] font-sans font-medium uppercase tracking-wider">
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">Requested</th>
                        <th className="py-2.5 px-3 text-right">Live Allocated</th>
                        <th className="py-2.5 px-3 text-right">Simulated</th>
                        <th className="py-2.5 px-3 text-right">Delta</th>
                        <th className="py-2.5 px-3 text-center">Simulated Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bd/50">
                      {itemDiffs.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-6 text-center text-t2 text-[14px]">
                            No allocation differences between current state and simulated scenario.
                          </td>
                        </tr>
                      ) : (
                        itemDiffs.map((diff, idx) => (
                          <tr key={idx} className="hover:bg-s2/40 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-t">#{diff.order_id}</td>
                            <td className="py-2.5 px-3 text-t2 truncate max-w-[150px]">
                              {diff.product_name || `Product #${diff.product_id}`}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-t">
                              {diff.requested_quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-series">
                              {diff.previous_allocated ?? diff.live_allocated ?? 0}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-t">
                              {diff.current_allocated ?? diff.simulated_allocated ?? 0}
                            </td>
                            <td
                              className={`py-2.5 px-3 text-right font-mono font-bold ${
                                (diff.delta || 0) > 0
                                  ? 'text-ok'
                                  : (diff.delta || 0) < 0
                                  ? 'text-no'
                                  : 'text-t2'
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
            </div>
          )}
        </div>
      </div>

      {/* Past Simulations History */}
      <div className="card-base space-y-4">
        <div className="flex items-center space-x-2 border-b border-bd pb-3">
          <History className="h-4 w-4 text-ac" />
          <h3 className="text-base font-bold text-t">
            Saved Simulation Runs History ({simulations.length})
          </h3>
        </div>

        {simulations.length === 0 ? (
          <div className="p-6 text-center text-[14px] text-t2">
            No simulation runs saved in the audit log yet.
          </div>
        ) : (
          <div className="rounded-card border border-bd overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="border-b border-bd bg-s2/60 text-t2 text-[12px] font-sans font-medium uppercase tracking-wider">
                    <th className="py-3 px-3">Run ID</th>
                    <th className="py-3 px-3">Scenario Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Executed At</th>
                    <th className="py-3 px-3 text-right">Items Changed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bd/50">
                  {simulations.slice(0, 10).map((sim) => (
                    <tr key={sim.id} className="hover:bg-s2/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-t">#{sim.id}</td>
                      <td className="py-3 px-3 font-semibold text-t">{sim.name || 'Simulation'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-pill border border-bd bg-s2 text-[11px] font-mono text-ac">
                          {sim.scenario_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-t2 text-[13px]">
                        {new Date(sim.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-ok">
                        {sim.diff?.summary?.total_changed ?? sim.diff?.changed_items ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
