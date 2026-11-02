import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  Cpu,
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
      const quantityVal = Number(adjustForm.quantity);
      await apiClient.put(`/inventory/${adjustItem.product_id}`, {
        adjustmentType: adjustForm.adjustmentType,
        quantity: quantityVal,
        on_hand_quantity: quantityVal,
        reason: adjustForm.reason.trim(),
        expectedVersion: adjustItem.version,
        expected_version: adjustItem.version,
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
    <div className="space-y-6 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <Database className="h-3.5 w-3.5" />
            <span>Warehouse Inventory &amp; Ledger</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            Inventory Management
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5">
            Track on-hand, reserved, and available stock levels with optimistic concurrency locks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/allocation"
            className="btn-primary flex items-center space-x-1.5 shadow-[0_0_20px_rgba(229,9,20,0.35)]"
          >
            <Cpu className="h-4 w-4" />
            <span>Allocation Center &rarr;</span>
          </Link>
          <div className="flex items-center space-x-2 rounded-pill bg-s2 border border-bd px-4 py-2 text-[14px] w-full md:w-64">
            <Search className="h-4 w-4 text-t2 shrink-0" />
            <input
              type="text"
              placeholder="Search SKU or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-t focus:outline-none text-[14px] w-full placeholder-t2/60"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/40 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline hover:text-t text-[12px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Inventory Table */}
      {loading ? (
        <div className="card-base p-12 text-center text-t2 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-ac" />
          <span className="text-[12px] font-mono tracking-wider">Loading inventory balances...</span>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="card-base p-12 text-center text-t2 space-y-3">
          <Database className="h-8 w-8 text-t2 mx-auto opacity-40" />
          <h3 className="text-base font-bold text-t">
            No Inventory Records
          </h3>
          <p className="text-[14px]">No warehouse stock items match your search.</p>
        </div>
      ) : (
        <div className="card-base p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead>
                <tr className="border-b border-bd bg-s2/60 text-t2 text-[12px] font-sans font-medium uppercase tracking-wider">
                  <th className="py-3.5 px-4">Product / SKU</th>
                  <th className="py-3.5 px-3 text-right">Physical On Hand</th>
                  <th className="py-3.5 px-3 text-right">Reserved Stock</th>
                  <th className="py-3.5 px-3 text-right">Available Free</th>
                  <th className="py-3.5 px-3 text-right">Safety Buffer</th>
                  <th className="py-3.5 px-3 text-right">Reorder Point</th>
                  <th className="py-3.5 px-3 text-center">Version Lock</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bd/50">
                {filteredInventory.map((item) => {
                  const available = item.available_quantity ?? (item.on_hand_quantity - item.reserved_quantity);
                  const isSafetyBreached = available <= item.safety_stock;
                  const isReorderBreached = available <= item.reorder_point;

                  return (
                    <tr
                      key={item.product_id}
                      className="hover:bg-s2/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-t">{item.product_name}</div>
                        <div className="text-[12px] font-mono text-t2 mt-0.5">
                          {item.sku}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-t">
                        {item.on_hand_quantity}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-series">
                        {item.reserved_quantity}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold">
                        <span
                          className={
                            available <= 0
                              ? 'text-no'
                              : isSafetyBreached
                              ? 'text-wa'
                              : 'text-ok'
                          }
                        >
                          {available}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-t2">
                        {item.safety_stock}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-t2">
                        {item.reorder_point}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-pill bg-s2 border border-bd text-t2">
                          v{item.version}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {available <= 0 ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold border border-no/40 text-no bg-no/10">
                            <AlertOctagon className="h-3 w-3" />
                            <span>Stockout</span>
                          </span>
                        ) : isSafetyBreached ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold border border-wa/40 text-wa bg-wa/10">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Low Safety</span>
                          </span>
                        ) : isReorderBreached ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold border border-wa/40 text-wa bg-wa/10">
                            <span>Reorder Alert</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-pill text-[11px] font-mono font-semibold border border-ok/40 text-ok bg-ok/10">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Healthy</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openAdjustModal(item)}
                          aria-label="Adjust Stock"
                          className="btn-header inline-flex items-center space-x-1.5 px-3 py-1.5 text-[12px]"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                          <span>Adjust Stock</span>
                        </button>
                        <button
                          onClick={() => openLedgerModal(item)}
                          className="p-2 rounded-full border border-bd text-t2 hover:text-t hover:border-white transition-colors"
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
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Adjust Physical Inventory: ${adjustItem?.product_name} (${adjustItem?.sku})`}
      >
        <form onSubmit={handleAdjustStock} className="space-y-4 text-[14px]">
          <div className="p-4 bg-s2 rounded-card border border-bd flex justify-between items-center">
            <div>
              <span className="text-t2 text-[11px] font-mono block">
                Current On Hand
              </span>
              <span className="text-base font-mono font-bold text-t">
                {adjustItem?.on_hand_quantity} units
              </span>
            </div>
            <div>
              <span className="text-t2 text-[11px] font-mono block">
                Reserved Units
              </span>
              <span className="text-base font-mono font-bold text-series">
                {adjustItem?.reserved_quantity} units
              </span>
            </div>
            <div>
              <span className="text-t2 text-[11px] font-mono block">
                Available Free
              </span>
              <span className="text-base font-mono font-bold text-ok">
                {adjustItem ? adjustItem.on_hand_quantity - adjustItem.reserved_quantity : 0} units
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="adjustment_type" className="block text-[12px] font-mono text-t2 mb-1.5">
                Adjustment Type
              </label>
              <select
                id="adjustment_type"
                value={adjustForm.adjustmentType}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
                className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t focus:border-ac focus:outline-none text-[14px]"
              >
                <option value="delta" className="bg-s text-t">Delta Relative (+/-)</option>
                <option value="set" className="bg-s text-t">Set Exact Count</option>
              </select>
            </div>

            <div>
              <label htmlFor="on_hand_quantity" className="block text-[12px] font-mono text-t2 mb-1.5">
                New On-Hand Quantity
              </label>
              <input
                id="on_hand_quantity"
                type="number"
                required
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                className="w-full bg-s2 rounded-pill border border-bd px-4 py-2 text-t focus:border-ac focus:outline-none text-[14px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="block text-[12px] font-mono text-t2 mb-1.5">
              Mandatory Audit Reason *
            </label>
            <textarea
              id="reason"
              rows="3"
              required
              placeholder="e.g. Physical inventory cycle count adjustment; damaged goods written off."
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full bg-s2 rounded-card border border-bd p-3 text-t focus:border-ac focus:outline-none placeholder-t2/50 text-[14px]"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-bd">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="btn-header px-5 py-2 text-[14px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjusting}
              className="btn-primary px-6 py-2 text-[14px] disabled:opacity-50"
            >
              {adjusting ? 'Confirming...' : 'Confirm Adjustment'}
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
        <div className="space-y-4 text-[14px]">
          {loadingMovements ? (
            <div className="p-8 text-center text-t2 flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-ac" />
              <span className="font-mono text-[12px]">Fetching ledger transactions...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="p-8 text-center text-t2">
              No historical inventory movements logged for this SKU yet.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2.5">
              {movements.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 bg-s2 rounded-card border border-bd flex flex-col space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[12px] font-mono">
                    <span className="font-bold text-ac">
                      {m.movement_type}
                    </span>
                    <span className="text-t2">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[14px]">
                    <span className="text-t2">Balance shift:</span>
                    <span className="font-mono font-semibold text-t">
                      {m.previous_on_hand}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-t2" />
                    <span className="font-mono font-bold text-ok">{m.new_on_hand}</span>
                    <span className="text-[12px] font-mono text-t2">
                      ({m.quantity > 0 ? `+${m.quantity}` : m.quantity})
                    </span>
                  </div>
                  {m.reference_type && (
                    <div className="text-[12px] text-t2">
                      Reference: <span className="text-t font-mono">{m.reference_type}</span>{' '}
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
