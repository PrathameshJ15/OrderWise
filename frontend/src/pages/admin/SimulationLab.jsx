import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  ShieldCheck,
  Layers,
  Sparkles,
  GitCompare,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '../../api/client';

export default function SimulationLab() {
  const [activeTab, setActiveTab] = useState('experiment'); // 'experiment' | 'saved' | 'compare'
  const [products, setProducts] = useState([]);
  const [savedSimulations, setSavedSimulations] = useState([]);
  const [selectedSimIds, setSelectedSimIds] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);

  // Experiment inputs
  const [scenarioType, setScenarioType] = useState('inventory_increase');
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(20);
  const [surgePercent, setSurgePercent] = useState(25);
  const [delayDays, setDelayDays] = useState(14);
  const [orderId, setOrderId] = useState('');
  const [hypotheticalPriority, setHypotheticalPriority] = useState('critical');

  // Chained steps
  const [chainedSteps, setChainedSteps] = useState([
    { type: 'inventory_increase', product_id: '', quantity: 20 },
    { type: 'priority_change', order_id: '', hypothetical_priority: 'critical' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Load products & saved simulations on mount
  useEffect(() => {
    loadProducts();
    loadSavedSimulations();
  }, []);

  async function loadProducts() {
    try {
      const res = await apiClient.get('/products?limit=50');
      if (res.success && res.data) {
        setProducts(res.data);
        if (res.data.length > 0) {
          setProductId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }

  async function loadSavedSimulations() {
    try {
      const res = await apiClient.get('/simulations?limit=20');
      if (res.success && res.data) {
        setSavedSimulations(res.data);
      }
    } catch (err) {
      console.error('Failed to load saved simulations:', err);
    }
  }

  function addChainedStep() {
    setChainedSteps([
      ...chainedSteps,
      { type: 'inventory_increase', product_id: products[0]?.id || 1, quantity: 10 },
    ]);
  }

  function removeChainedStep(index) {
    setChainedSteps(chainedSteps.filter((_, idx) => idx !== index));
  }

  function updateChainedStep(index, field, value) {
    const updated = [...chainedSteps];
    updated[index][field] = value;
    setChainedSteps(updated);
  }

  async function handleRunSimulation(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    let payload = {};

    if (scenarioType === 'chained') {
      payload = {
        scenario_type: 'chained',
        steps: chainedSteps.map((step) => ({
          type: step.type,
          product_id: step.product_id ? Number(step.product_id) : undefined,
          quantity: step.quantity ? Number(step.quantity) : undefined,
          surge_percent: step.surge_percent ? Number(step.surge_percent) : undefined,
          delay_days: step.delay_days ? Number(step.delay_days) : undefined,
          order_id: step.order_id ? Number(step.order_id) : undefined,
          hypothetical_priority: step.hypothetical_priority || undefined,
        })),
        name: name || 'Chained Scenario Experiment',
      };
    } else {
      let inputs = {};
      if (scenarioType === 'inventory_increase' || scenarioType === 'inventory_decrease') {
        inputs = { product_id: Number(productId), quantity: Number(quantity) };
      } else if (scenarioType === 'demand_surge') {
        inputs = { surge_percent: Number(surgePercent), product_id: productId ? Number(productId) : undefined };
      } else if (scenarioType === 'supplier_delay') {
        inputs = { product_id: productId ? Number(productId) : undefined, delay_days: Number(delayDays) };
      } else if (scenarioType === 'priority_change') {
        inputs = { order_id: Number(orderId), hypothetical_priority: hypotheticalPriority };
      }

      payload = {
        scenario_type: scenarioType,
        scenario_inputs: inputs,
        name: name || `${scenarioType.replace('_', ' ').toUpperCase()} Experiment`,
      };
    }

    try {
      const res = await apiClient.post('/simulations', payload);
      if (res.success && res.data) {
        setResult(res.data);
        loadSavedSimulations(); // Refresh list
      }
    } catch (err) {
      setError(err.message || 'Failed to execute simulation');
    } finally {
      setLoading(false);
    }
  }

  function toggleSelectSim(id) {
    if (selectedSimIds.includes(id)) {
      setSelectedSimIds(selectedSimIds.filter((item) => item !== id));
    } else {
      setSelectedSimIds([...selectedSimIds, id]);
    }
  }

  async function handleCompare() {
    if (selectedSimIds.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/simulations/compare', {
        simulation_ids: selectedSimIds,
      });
      if (res.success && res.data) {
        setComparisonData(res.data);
        setActiveTab('compare');
      }
    } catch (err) {
      setError(err.message || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border border-white/10 bg-[#11120f] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FlaskConical className="h-7 w-7 text-[#c8ff3a]" />
              <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-[#eef0e6]">
                Simulation Lab
              </h1>
            </div>
            <p className="mt-1 text-xs text-[#8a8f80]">
              Zero-risk supply chain what-if sandbox. Experiments run strictly in-memory using the deterministic allocation engine.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              LIVE DATA IS SAFE
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex border-b border-white/10 gap-2">
          <button
            onClick={() => setActiveTab('experiment')}
            className={`px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'experiment'
                ? 'border-b-2 border-[#c8ff3a] text-[#c8ff3a]'
                : 'text-[#8a8f80] hover:text-[#eef0e6]'
            }`}
          >
            Experiment Builder
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'saved'
                ? 'border-b-2 border-[#c8ff3a] text-[#c8ff3a]'
                : 'text-[#8a8f80] hover:text-[#eef0e6]'
            }`}
          >
            Saved Runs ({savedSimulations.length})
          </button>
          {comparisonData && (
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'compare'
                  ? 'border-b-2 border-[#c8ff3a] text-[#c8ff3a]'
                  : 'text-[#8a8f80] hover:text-[#eef0e6]'
              }`}
            >
              Side-by-Side Comparison
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 p-4 text-xs font-mono text-red-400">
          {error}
        </div>
      )}

      {/* TAB 1: EXPERIMENT BUILDER */}
      {activeTab === 'experiment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-5 border border-white/10 bg-[#11120f] p-6 space-y-6">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#eef0e6] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#c8ff3a]" />
              Scenario Configuration
            </h2>

            <form onSubmit={handleRunSimulation} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-[#8a8f80] mb-1">
                  Scenario Type
                </label>
                <select
                  value={scenarioType}
                  onChange={(e) => setScenarioType(e.target.value)}
                  className="w-full border border-white/15 bg-[#0a0b08] px-3 py-2 text-xs font-mono text-[#eef0e6] focus:border-[#c8ff3a] focus:outline-none"
                >
                  <option value="inventory_increase">Stock Increase (+ Units)</option>
                  <option value="inventory_decrease">Stock Reduction (- Units)</option>
                  <option value="demand_surge">Demand Spike (% Surge)</option>
                  <option value="supplier_delay">Supplier Lead Time Delay</option>
                  <option value="priority_change">Hypothetical Priority Change</option>
                  <option value="chained">Scenario Chaining (Multiple Changes)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#8a8f80] mb-1">
                  Experiment Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Emergency Batch Simulation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-white/15 bg-[#0a0b08] px-3 py-2 text-xs font-mono text-[#eef0e6] focus:border-[#c8ff3a] focus:outline-none"
                />
              </div>

              {/* Dynamic Single Inputs */}
              {scenarioType !== 'chained' && (
                <>
                  {(scenarioType === 'inventory_increase' ||
                    scenarioType === 'inventory_decrease' ||
                    scenarioType === 'demand_surge' ||
                    scenarioType === 'supplier_delay') && (
                    <div>
                      <label className="block text-xs font-mono uppercase text-[#8a8f80] mb-1">
                        Target Product
                      </label>
                      <select
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        className="w-full border border-white/15 bg-[#0a0b08] px-3 py-2 text-xs font-mono text-[#eef0e6] focus:border-[#c8ff3a] focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — {p.on_hand_quantity} in stock
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(scenarioType === 'inventory_increase' || scenarioType === 'inventory_decrease') && (
                    <div>
                      <label className="block text-xs font-mono uppercase text-[#8a8f80] mb-1">
                        Quantity Delta (Units)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full border border-white/15 bg-[#0a0b08] px-3 py-2 text-xs font-mono text-[#eef0e6] focus:border-[#c8ff3a] focus:outline-none"
                      />
                    </div>
                  )}

                  {scenarioType === 'demand_surge' && (
                    <div>
                      <label className="block text-xs font-mono uppercase text-[#8a8f80] mb-1">
                        Demand Surge Percent (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={surgePercent}
                        onChange={(e) => setSurgePercent(e.target.value)}
                        className="w-full border border-white/15 bg-[#0a0b08] px-3 py-2 text-xs font-mono text-[#eef0e6] focus:border-[#c8ff3a] focus:outline-none"
                      />
                    </div>
                  )}

                  {scenarioType === 'supplier_delay' && (
                    <div>
                      <label className="block text-xs font-mono uppercase text-[#8a8f80] mb-1">
                        Delay (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={delayDays}
                        onChange={(e) => setDelayDays(e.target.value)}
                        className="w-full border border-white/15 bg-[#0a0b08] px-3 py-2 text-xs font-mono text-[#eef0e6] focus:border-[#c8ff3a] focus:outline-none"
                      />
                    </div>
                  )}

                  {scenarioType === 'priority_change' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-mono uppercase text-[#8a8f80] mb-1">
                          Target Order ID
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 1"
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                          required
                          className="w-full border border-white/15 bg-[#0a0b08] px-3 py-2 text-xs font-mono text-[#eef0e6] focus:border-[#c8ff3a] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase text-[#8a8f80] mb-1">
                          Hypothetical Priority
                        </label>
                        <select
                          value={hypotheticalPriority}
                          onChange={(e) => setHypotheticalPriority(e.target.value)}
                          className="w-full border border-white/15 bg-[#0a0b08] px-3 py-2 text-xs font-mono text-[#eef0e6] focus:border-[#c8ff3a] focus:outline-none"
                        >
                          <option value="critical">CRITICAL (Rank 4)</option>
                          <option value="high">HIGH (Rank 3)</option>
                          <option value="medium">MEDIUM (Rank 2)</option>
                          <option value="low">LOW (Rank 1)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Chained Multi-Step Builder */}
              {scenarioType === 'chained' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#8a8f80]">Chained Steps ({chainedSteps.length})</span>
                    <button
                      type="button"
                      onClick={addChainedStep}
                      className="text-xs font-mono text-[#c8ff3a] hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Step
                    </button>
                  </div>

                  {chainedSteps.map((step, idx) => (
                    <div key={idx} className="border border-white/10 bg-[#0a0b08] p-3 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-[#c8ff3a]">Step #{idx + 1}</span>
                        {chainedSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChainedStep(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <select
                        value={step.type}
                        onChange={(e) => updateChainedStep(idx, 'type', e.target.value)}
                        className="w-full border border-white/10 bg-[#11120f] px-2 py-1 text-xs font-mono text-[#eef0e6]"
                      >
                        <option value="inventory_increase">Stock Increase</option>
                        <option value="inventory_decrease">Stock Decrease</option>
                        <option value="priority_change">Priority Change</option>
                        <option value="demand_surge">Demand Surge</option>
                      </select>

                      {step.type.includes('inventory') && (
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={step.product_id}
                            onChange={(e) => updateChainedStep(idx, 'product_id', e.target.value)}
                            className="border border-white/10 bg-[#11120f] px-2 py-1 text-xs font-mono text-[#eef0e6]"
                          >
                            <option value="">Select product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.sku}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Qty"
                            value={step.quantity}
                            onChange={(e) => updateChainedStep(idx, 'quantity', e.target.value)}
                            className="border border-white/10 bg-[#11120f] px-2 py-1 text-xs font-mono text-[#eef0e6]"
                          />
                        </div>
                      )}

                      {step.type === 'priority_change' && (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Order ID"
                            value={step.order_id}
                            onChange={(e) => updateChainedStep(idx, 'order_id', e.target.value)}
                            className="border border-white/10 bg-[#11120f] px-2 py-1 text-xs font-mono text-[#eef0e6]"
                          />
                          <select
                            value={step.hypothetical_priority}
                            onChange={(e) => updateChainedStep(idx, 'hypothetical_priority', e.target.value)}
                            className="border border-white/10 bg-[#11120f] px-2 py-1 text-xs font-mono text-[#eef0e6]"
                          >
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c8ff3a] py-3 text-xs font-mono font-bold uppercase tracking-wider text-[#0a0b08] hover:bg-[#d4ff60] transition-colors flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <span className="animate-pulse">RUNNING IN-MEMORY EXPERIMENT...</span>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    RUN SIMULATION
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-7 space-y-6">
            {result ? (
              <div className="space-y-6">
                {/* Summary Banner */}
                <div className="border border-[#c8ff3a]/40 bg-[#11120f] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#c8ff3a] uppercase font-bold tracking-wider">
                      Simulation Results
                    </span>
                    <span className="text-xs font-mono text-[#8a8f80]">
                      {result.simulation?.name}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#eef0e6] font-mono">
                    {result.results?.scenario_description}
                  </p>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border border-white/10 bg-[#11120f] p-4 text-center">
                    <span className="block text-2xl font-display font-bold text-[#eef0e6]">
                      {result.results?.affected_orders}
                    </span>
                    <span className="text-xs font-mono uppercase text-[#8a8f80]">Affected Orders</span>
                  </div>
                  <div className="border border-emerald-500/20 bg-[#11120f] p-4 text-center">
                    <span className="block text-2xl font-display font-bold text-emerald-400">
                      +{result.results?.improvements}
                    </span>
                    <span className="text-xs font-mono uppercase text-[#8a8f80]">Improved</span>
                  </div>
                  <div className="border border-rose-500/20 bg-[#11120f] p-4 text-center">
                    <span className="block text-2xl font-display font-bold text-rose-400">
                      -{result.results?.degradations}
                    </span>
                    <span className="text-xs font-mono uppercase text-[#8a8f80]">Degraded</span>
                  </div>
                  <div className="border border-[#c8ff3a]/20 bg-[#11120f] p-4 text-center">
                    <span className="block text-2xl font-display font-bold text-[#c8ff3a]">
                      {result.results?.remaining_simulated_stock}
                    </span>
                    <span className="text-xs font-mono uppercase text-[#8a8f80]">Remaining Stock</span>
                  </div>
                </div>

                {/* Impact Diff Table */}
                <div className="border border-white/10 bg-[#11120f] overflow-hidden">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase font-bold text-[#eef0e6]">
                      Allocation Diff Matrix ({result.results?.changes?.length || 0} items)
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#0a0b08] text-[#8a8f80] border-b border-white/10">
                        <tr>
                          <th className="p-3">Order / Customer</th>
                          <th className="p-3">Product</th>
                          <th className="p-3 text-right">Req</th>
                          <th className="p-3 text-center">Baseline &rarr; Sim</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">&Delta; Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {result.results?.changes?.map((c) => (
                          <tr
                            key={c.order_item_id}
                            className={`hover:bg-white/[0.02] ${
                              c.changed ? 'bg-white/[0.03]' : ''
                            }`}
                          >
                            <td className="p-3 text-[#eef0e6]">
                              <span className="font-bold">#{c.order_id}</span>
                              <span className="block text-[#8a8f80] text-[10px]">{c.customer_name}</span>
                            </td>
                            <td className="p-3 text-[#eef0e6]">
                              {c.product_name || c.sku}
                            </td>
                            <td className="p-3 text-right text-[#8a8f80]">{c.requested_quantity}</td>
                            <td className="p-3 text-center">
                              <span className="text-[#8a8f80]">{c.baseline_allocated}</span>
                              <span className="mx-1.5 text-white/40">&rarr;</span>
                              <span className="font-bold text-[#eef0e6]">{c.simulated_allocated}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  c.simulated_status === 'fulfilled'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : c.simulated_status === 'partially_fulfilled'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {c.simulated_status}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold">
                              {c.delta > 0 && <span className="text-emerald-400">+{c.delta}</span>}
                              {c.delta < 0 && <span className="text-rose-400">{c.delta}</span>}
                              {c.delta === 0 && <span className="text-[#8a8f80]">0</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-white/15 bg-[#11120f]/50 p-12 text-center text-[#8a8f80]">
                <Layers className="h-10 w-10 text-white/20 mx-auto mb-3" />
                <p className="text-xs font-mono uppercase tracking-wider text-[#eef0e6]">
                  No simulation executed yet
                </p>
                <p className="text-[11px] font-mono mt-1 text-[#8a8f80]">
                  Configure scenario parameters on the left and click "RUN SIMULATION".
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SAVED RUNS & COMPARISON SELECTION */}
      {activeTab === 'saved' && (
        <div className="border border-white/10 bg-[#11120f] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#eef0e6]">
                Saved Scenario Experiments
              </h2>
              <p className="text-xs text-[#8a8f80]">
                Select two or more scenarios to compare their allocation outcomes side-by-side.
              </p>
            </div>
            <button
              onClick={handleCompare}
              disabled={selectedSimIds.length < 2 || loading}
              className="bg-[#c8ff3a] px-4 py-2 text-xs font-mono font-bold uppercase text-[#0a0b08] disabled:opacity-40 hover:bg-[#d4ff60] transition-colors flex items-center gap-2"
            >
              <GitCompare className="h-4 w-4" />
              Compare Selected ({selectedSimIds.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a0b08] text-[#8a8f80] border-b border-white/10">
                <tr>
                  <th className="p-3 w-10">Select</th>
                  <th className="p-3">ID</th>
                  <th className="p-3">Scenario Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Affected Orders</th>
                  <th className="p-3 text-right">Items Changed</th>
                  <th className="p-3">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {savedSimulations.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => toggleSelectSim(s.id)}
                    className="cursor-pointer hover:bg-white/[0.03]"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedSimIds.includes(s.id)}
                        onChange={() => {}}
                        className="rounded-none border-white/20 bg-[#0a0b08] text-[#c8ff3a]"
                      />
                    </td>
                    <td className="p-3 text-[#c8ff3a] font-bold">#{s.id}</td>
                    <td className="p-3 text-[#eef0e6]">{s.name || s.scenario_type}</td>
                    <td className="p-3 uppercase text-[#8a8f80]">{s.scenario_type}</td>
                    <td className="p-3 text-right text-[#eef0e6]">{s.affected_orders ?? '-'}</td>
                    <td className="p-3 text-right text-[#eef0e6]">{s.total_changed ?? '-'}</td>
                    <td className="p-3 text-[#8a8f80]">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SIDE-BY-SIDE COMPARISON */}
      {activeTab === 'compare' && comparisonData && (
        <div className="border border-white/10 bg-[#11120f] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#eef0e6] flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-[#c8ff3a]" />
                Side-by-Side Scenario Analysis
              </h2>
              <p className="text-xs text-[#8a8f80] mt-1">
                Comparing {comparisonData.compared_count} simulated interventions.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('saved')}
              className="border border-white/20 px-3 py-1.5 text-xs font-mono text-[#eef0e6] hover:bg-white/5"
            >
              Back to Saved List
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonData.scenarios?.map((sc) => (
              <div key={sc.id} className="border border-white/15 bg-[#0a0b08] p-5 space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <span className="text-[10px] font-mono uppercase text-[#c8ff3a] font-bold">
                    Scenario #{sc.id}
                  </span>
                  <h3 className="text-sm font-display font-bold text-[#eef0e6] mt-0.5">
                    {sc.name}
                  </h3>
                  <span className="inline-block mt-1 text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 text-[#8a8f80]">
                    {sc.scenario_type}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-[#8a8f80]">Affected Orders:</span>
                    <span className="text-[#eef0e6] font-bold">{sc.affected_orders}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-[#8a8f80]">Improvements:</span>
                    <span className="text-emerald-400 font-bold">+{sc.improvements}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-[#8a8f80]">Degradations:</span>
                    <span className="text-rose-400 font-bold">-{sc.degradations}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-[#8a8f80]">Remaining Stock:</span>
                    <span className="text-[#c8ff3a] font-bold">{sc.remaining_stock} units</span>
                  </div>
                </div>

                {sc.newly_fulfilled?.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">
                      Newly Fulfilled:
                    </span>
                    <ul className="text-[11px] font-mono text-[#8a8f80] space-y-0.5">
                      {sc.newly_fulfilled.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
