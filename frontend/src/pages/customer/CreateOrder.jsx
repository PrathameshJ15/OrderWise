import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import Toast from '../../components/ui/Toast';
import Alert from '../../components/ui/Alert';
import {
  Plus,
  Trash2,
  Calendar,
  FileText,
  Package,
  ArrowRight,
  Info,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export function CreateOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProductId = searchParams.get('product_id');

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Form state
  const [promisedDate, setPromisedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // Default to 2 weeks out
    return d.toISOString().split('T')[0];
  });
  const [businessNotes, setBusinessNotes] = useState('');

  const [items, setItems] = useState([
    {
      product_id: '',
      requested_quantity: 10,
      minimum_acceptable_quantity: 5,
      partial_delivery_allowed: true,
    },
  ]);

  // Load products catalog
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const res = await apiClient.get('/products');
        const list = res.products || res.data?.products || res;
        const prodList = Array.isArray(list) ? list : [];
        setProducts(prodList);

        // Prepopulate product if passed via URL
        if (preselectedProductId && prodList.length > 0) {
          const match = prodList.find((p) => String(p.id) === String(preselectedProductId));
          if (match) {
            setItems([
              {
                product_id: String(match.id),
                requested_quantity: 10,
                minimum_acceptable_quantity: 5,
                partial_delivery_allowed: true,
              },
            ]);
          }
        } else if (prodList.length > 0) {
          setItems((prev) =>
            prev.map((item, idx) => (idx === 0 && !item.product_id ? { ...item, product_id: String(prodList[0].id) } : item))
          );
        }
      } catch (err) {
        console.error('Failed to load products for order form:', err);
        setErrorMessage('Failed to load product catalog');
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, [preselectedProductId]);

  const handleAddItem = () => {
    const defaultProduct = products.length > 0 ? String(products[0].id) : '';
    setItems((prev) => [
      ...prev,
      {
        product_id: defaultProduct,
        requested_quantity: 10,
        minimum_acceptable_quantity: 5,
        partial_delivery_allowed: true,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    // Clear any validation errors for removed item
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[`item_${index}`];
      return updated;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };

      if (field === 'partial_delivery_allowed') {
        item.partial_delivery_allowed = value;
        if (!value) {
          // If partial delivery is disallowed, min quantity MUST equal requested quantity
          item.minimum_acceptable_quantity = item.requested_quantity;
        }
      } else if (field === 'requested_quantity') {
        const numVal = Math.max(1, parseInt(value, 10) || 1);
        item.requested_quantity = numVal;
        if (!item.partial_delivery_allowed || item.minimum_acceptable_quantity > numVal) {
          item.minimum_acceptable_quantity = numVal;
        }
      } else if (field === 'minimum_acceptable_quantity') {
        const numVal = Math.max(1, parseInt(value, 10) || 1);
        item.minimum_acceptable_quantity = Math.min(numVal, item.requested_quantity);
      } else {
        item[field] = value;
      }

      next[index] = item;
      return next;
    });

    if (validationErrors[`item_${index}`]) {
      setValidationErrors((prev) => ({ ...prev, [`item_${index}`]: null }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (items.length === 0) {
      errs.general = 'At least one item is required in the order.';
    }

    const seenProducts = new Set();
    items.forEach((item, idx) => {
      if (!item.product_id) {
        errs[`item_${idx}`] = 'Please select a product.';
      } else if (seenProducts.has(item.product_id)) {
        errs[`item_${idx}`] = 'Duplicate product. Merge quantities into a single line item.';
      } else {
        seenProducts.add(item.product_id);
      }

      if (item.requested_quantity <= 0) {
        errs[`item_${idx}`] = 'Requested quantity must be at least 1.';
      }

      if (item.minimum_acceptable_quantity <= 0) {
        errs[`item_${idx}`] = 'Minimum acceptable quantity must be at least 1.';
      }

      if (item.minimum_acceptable_quantity > item.requested_quantity) {
        errs[`item_${idx}`] = 'Minimum acceptable quantity cannot exceed requested quantity.';
      }

      if (!item.partial_delivery_allowed && item.minimum_acceptable_quantity !== item.requested_quantity) {
        errs[`item_${idx}`] = 'When partial delivery is disabled, minimum quantity must equal requested quantity.';
      }
    });

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        promised_delivery_date: promisedDate || null,
        business_notes: businessNotes.trim() || null,
        items: items.map((it) => ({
          product_id: parseInt(it.product_id, 10),
          requested_quantity: parseInt(it.requested_quantity, 10),
          minimum_acceptable_quantity: parseInt(it.minimum_acceptable_quantity, 10),
          partial_delivery_allowed: Boolean(it.partial_delivery_allowed),
        })),
      };

      const res = await apiClient.post('/orders', payload);
      const createdOrder = res.order || res.data?.order || res;
      navigate(`/orders/${createdOrder.id}`);
    } catch (err) {
      console.error('Order creation error:', err);
      const msg = err.error?.message || err.message || 'Failed to place order. Please review line items.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalRequestedUnits = items.reduce((sum, it) => sum + (parseInt(it.requested_quantity, 10) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage('')} />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Equipment Order</h1>
        <p className="text-sm text-slate-500 mt-1">
          Specify items, delivery target, and flexible allocation parameters. The deterministic allocation engine
          prioritizes and schedules fulfillment according to business rules.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Line Items Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Line Items & Allocation Rules</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set minimum acceptable quantities to permit partial shipments during stock scarcity.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>

          {/* Items list */}
          <div className="space-y-4">
            {items.map((item, index) => {
              const selectedProduct = products.find((p) => String(p.id) === String(item.product_id));
              const itemError = validationErrors[`item_${index}`];

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    itemError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 bg-slate-50/50'
                  } transition-all space-y-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
                        aria-label={`Remove item ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Product Select */}
                    <div className="md:col-span-5">
                      <label
                        htmlFor={`product-select-${index}`}
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Product / SKU
                      </label>
                      <select
                        id={`product-select-${index}`}
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        className="block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white shadow-xs focus:ring-indigo-500 focus:border-indigo-500 transition"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — {p.available_stock} available
                          </option>
                        ))}
                      </select>
                      {selectedProduct && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          Stock: {selectedProduct.available_stock} {selectedProduct.unit} free of {selectedProduct.on_hand_quantity} on hand
                        </p>
                      )}
                    </div>

                    {/* Requested Quantity */}
                    <div className="md:col-span-2">
                      <label
                        htmlFor={`req-qty-${index}`}
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Requested Qty
                      </label>
                      <input
                        id={`req-qty-${index}`}
                        type="number"
                        min="1"
                        value={item.requested_quantity}
                        onChange={(e) => handleItemChange(index, 'requested_quantity', e.target.value)}
                        className="block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white shadow-xs focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>

                    {/* Minimum Acceptable Quantity */}
                    <div className="md:col-span-3">
                      <label
                        htmlFor={`min-qty-${index}`}
                        className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between"
                      >
                        <span>Min Acceptable</span>
                        <span className="text-[10px] text-slate-400 font-normal">Threshold</span>
                      </label>
                      <input
                        id={`min-qty-${index}`}
                        type="number"
                        min="1"
                        max={item.requested_quantity}
                        disabled={!item.partial_delivery_allowed}
                        value={item.minimum_acceptable_quantity}
                        onChange={(e) => handleItemChange(index, 'minimum_acceptable_quantity', e.target.value)}
                        className={`block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white shadow-xs focus:ring-indigo-500 focus:border-indigo-500 transition ${
                          !item.partial_delivery_allowed ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    {/* Partial Delivery Toggle */}
                    <div className="md:col-span-2 flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer select-none py-2">
                        <input
                          type="checkbox"
                          checked={item.partial_delivery_allowed}
                          onChange={(e) => handleItemChange(index, 'partial_delivery_allowed', e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
                        />
                        <span className="text-xs font-medium text-slate-700">Partial OK</span>
                      </label>
                    </div>
                  </div>

                  {itemError && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {itemError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick info note */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>How partial fulfillment works:</strong> If stock is scarce, our engine will fulfill your order with
              available stock as long as it meets or exceeds your <em>Min Acceptable</em> threshold. If available stock is
              below that threshold, the item is deferred rather than stranding unusable parts.
            </span>
          </div>
        </div>

        {/* Delivery & Business Notes Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Delivery Schedule & Operational Context
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="promised-date" className="block text-sm font-semibold text-slate-700 mb-1">
                Target Delivery Date
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="promised-date"
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 shadow-xs focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Earlier target dates receive deterministic priority tie-breaking.
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="business-notes" className="block text-sm font-semibold text-slate-700 mb-1">
                Business Notes / Urgency Context
              </label>
              <textarea
                id="business-notes"
                rows="3"
                value={businessNotes}
                onChange={(e) => setBusinessNotes(e.target.value)}
                placeholder="E.g., Site 3 offshore rig overhaul scheduled for next week. Critical telemetry replacement required."
                className="block w-full p-3 text-sm rounded-lg border border-slate-300 shadow-xs focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Business notes are reviewed by administrators and assist AI priority recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary & Submit bar */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Order Summary</div>
            <div className="text-xl font-bold mt-1">
              {items.length} line item(s) • {totalRequestedUnits} total units requested
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || loadingProducts}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold shadow-md transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <span>Submit Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreateOrder;
