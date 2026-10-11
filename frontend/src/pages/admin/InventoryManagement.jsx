import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  History,
  Sliders,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import apiClient from '../../api/client';
import Modal from '../../components/ui/Modal';

export default function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Stock Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustmentType: 'delta', // 'delta' | 'set'
    quantity: 10,
    reason: '',
  });
  const [adjusting, setAdjusting] = useState(false);

  // Movement Ledger Modal State
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerItem, setLedgerItem] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/inventory');
      setInventory(res.data || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to fetch inventory stock.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const openAdjustModal = (item) => {
    setAdjustItem(item);
    setAdjustForm({
      adjustmentType: 'delta',
      quantity: 10,
      reason: '',
    });
    setAdjustModalOpen(true);
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustItem) return;
    if (!adjustForm.reason.trim()) {
      setError('A mandatory reason is required for inventory ledger adjustments.');
      return;
    }

    setAdjusting(true);
    setError(null);
    try {
      await apiClient.put(`/inventory/${adjustItem.product_id}`, {
        adjustmentType: adjustForm.adjustmentType,
        quantity: Number(adjustForm.quantity),
        reason: adjustForm.reason.trim(),
        expectedVersion: adjustItem.version,
      });
      setAdjustModalOpen(false);
      await fetchInventory();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to adjust inventory stock.');
    } finally {
      setAdjusting(false);
    }
  };

  const openLedgerModal = async (item) => {
    setLedgerItem(item);
    setLedgerModalOpen(true);
    setLoadingMovements(true);
    try {
      const res = await apiClient.get(`/inventory/${item.product_id}/movements`);
      setMovements(res.data || []);
    } catch (_err) {
      setError('Failed to fetch inventory movement ledger.');
    } finally {
      setLoadingMovements(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.product_name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <Database className="h-3 w-3" />
            <span>WAREHOUSE INVENTORY &amp; LEDGER</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Inventory Management
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Track on-hand, reserved, and available stock levels with optimistic concurrency locks.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 border border-arcade-border bg-arcade-surface px-3 py-2 text-xs w-full md:w-64">
          <Search className="h-3.5 w-3.5 text-arcade-secondary" />
          <input
            type="text"
            placeholder="Search SKU or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-arcade-primary focus:outline-none text-xs w-full placeholder-arcade-secondary/60"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 border border-arcade-danger/40 bg-arcade-danger/10 text-arcade-danger text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline hover:text-white text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Inventory Table */}
      {loading ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-arcade-accent" />
          <span className="text-xs uppercase tracking-wider">Loading inventory balances...</span>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary space-y-3">
          <Database className="h-8 w-8 text-arcade-secondary mx-auto opacity-50" />
          <h3 className="font-display text-base uppercase text-arcade-primary font-bold">
            No Inventory Records
          </h3>
          <p className="text-xs">No warehouse stock items match your search.</p>
        </div>
      ) : (
        <div className="border border-arcade-border bg-arcade-neutral overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arcade-border bg-arcade-surface/60 text-arcade-secondary uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-3 text-right">Physical On Hand</th>
                <th className="py-3 px-3 text-right">Reserved Stock</th>
                <th className="py-3 px-3 text-right">Available Free</th>
                <th className="py-3 px-3 text-right">Safety Buffer</th>
                <th className="py-3 px-3 text-right">Reorder Point</th>
                <th className="py-3 px-3 text-center">Version Lock</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arcade-border/50">
              {filteredInventory.map((item) => {
                const available = item.available_quantity ?? (item.on_hand_quantity - item.reserved_quantity);
                const isSafetyBreached = available <= item.safety_stock;
                const isReorderBreached = available <= item.reorder_point;

                return (
                  <tr
                    key={item.product_id}
                    className={`hover:bg-arcade-surface/50 transition-colors ${
                      isSafetyBreached
                        ? 'bg-arcade-danger/[0.02]'
                        : isReorderBreached
                        ? 'bg-arcade-warning/[0.02]'
                        : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-arcade-primary">{item.product_name}</div>
                      <div className="text-[10px] text-arcade-accent font-bold mt-0.5">
                        {item.sku}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-semibold text-arcade-primary">
                      {item.on_hand_quantity}
                    </td>

                    <td className="py-3.5 px-3 text-right text-arcade-secondary">
                      {item.reserved_quantity}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`font-bold ${
                          available <= 0
                            ? 'text-arcade-danger'
                            : isSafetyBreached
                            ? 'text-arcade-warning'
                            : 'text-arcade-accent'
                        }`}
                      >
                        {available}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right text-arcade-secondary">
                      {item.safety_stock}
                    </td>

                    <td className="py-3.5 px-3 text-right text-arcade-secondary">
                      {item.reorder_point}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="text-[10px] px-1.5 py-0.5 bg-arcade-surface border border-arcade-border text-arcade-secondary">
                        v{item.version}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {available <= 0 ? (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-[9px] uppercase font-bold border border-arcade-danger/40 text-arcade-danger bg-arcade-danger/10">
                          <AlertOctagon className="h-2.5 w-2.5" />
                          <span>Stockout</span>
                        </span>
                      ) : isSafetyBreached ? (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-[9px] uppercase font-bold border border-arcade-warning/40 text-arcade-warning bg-arcade-warning/10">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          <span>Low Safety</span>
                        </span>
                      ) : isReorderBreached ? (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-[9px] uppercase font-bold border border-yellow-500/40 text-yellow-400 bg-yellow-500/10">
                          <span>Reorder Alert</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-[9px] uppercase font-bold border border-arcade-accent/30 text-arcade-accent bg-arcade-accent/10">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>Healthy</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openAdjustModal(item)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 border border-arcade-border text-arcade-primary hover:border-arcade-accent hover:text-arcade-accent text-[11px] uppercase tracking-wider transition-colors"
                      >
                        <Sliders className="h-3 w-3" />
                        <span>Adjust</span>
                      </button>
                      <button
                        onClick={() => openLedgerModal(item)}
                        className="p-1 border border-arcade-border text-arcade-secondary hover:text-arcade-primary transition-colors"
                        title="View Movement Ledger"
                      >
                        <History className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Inventory: ${adjustItem?.product_name} (${adjustItem?.sku})`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
          <div className="p-3 bg-arcade-surface border border-arcade-border flex justify-between items-center text-xs">
            <div>
              <span className="text-arcade-secondary text-[10px] uppercase block">
                Current On Hand
              </span>
              <span className="text-base font-bold text-arcade-primary">
                {adjustItem?.on_hand_quantity} units
              </span>
            </div>
            <div>
              <span className="text-arcade-secondary text-[10px] uppercase block">
                Reserved Units
              </span>
              <span className="text-base font-bold text-arcade-secondary">
                {adjustItem?.reserved_quantity} units
              </span>
            </div>
            <div>
              <span className="text-arcade-secondary text-[10px] uppercase block">
                Available Free
              </span>
              <span className="text-base font-bold text-arcade-accent">
                {adjustItem ? adjustItem.on_hand_quantity - adjustItem.reserved_quantity : 0} units
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
                Adjustment Type
              </label>
              <select
                value={adjustForm.adjustmentType}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
                className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none uppercase text-xs"
              >
                <option value="delta">Delta Relative (+/-)</option>
                <option value="set">Set Exact Count</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
                {adjustForm.adjustmentType === 'delta' ? 'Delta Amount (+/-)' : 'New Absolute Quantity'}
              </label>
              <input
                type="number"
                required
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
              Mandatory Audit Reason *
            </label>
            <textarea
              rows="3"
              required
              placeholder="e.g. Physical inventory cycle count adjustment; damaged goods written off."
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none placeholder-arcade-secondary/50"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-arcade-border">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="px-3 py-1.5 border border-arcade-border text-arcade-secondary uppercase text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjusting}
              className="px-4 py-1.5 bg-arcade-accent text-arcade-surface font-bold uppercase text-xs hover:opacity-90 disabled:opacity-50"
            >
              {adjusting ? 'Committing...' : 'Commit Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Movement Ledger Modal */}
      <Modal
        isOpen={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        title={`Audit Movement Ledger: ${ledgerItem?.sku}`}
      >
        <div className="space-y-4 text-xs">
          {loadingMovements ? (
            <div className="p-8 text-center text-arcade-secondary flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-arcade-accent" />
              <span>Fetching ledger transactions...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="p-8 text-center text-arcade-secondary">
              No historical inventory movements logged for this SKU yet.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {movements.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-arcade-surface border border-arcade-border flex flex-col space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase text-arcade-accent">
                      {m.movement_type}
                    </span>
                    <span className="text-arcade-secondary">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-arcade-secondary">Balance shift:</span>
                    <span className="font-semibold text-arcade-primary">
                      {m.previous_on_hand}
                    </span>
                    <ArrowRight className="h-3 w-3 text-arcade-secondary" />
                    <span className="font-bold text-arcade-accent">{m.new_on_hand}</span>
                    <span className="text-[10px] text-arcade-secondary">
                      ({m.quantity > 0 ? `+${m.quantity}` : m.quantity})
                    </span>
                  </div>
                  {m.reference_type && (
                    <div className="text-[10px] text-arcade-secondary">
                      Reference: <span className="text-arcade-primary">{m.reference_type}</span>{' '}
                      {m.reference_id ? `#${m.reference_id}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
