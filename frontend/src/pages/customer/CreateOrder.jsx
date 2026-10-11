import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Calendar,
  FileText,
  Send,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
  Check,
} from 'lucide-react';
import apiClient from '../../api/client';

export default function CreateOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProductId = searchParams.get('product_id');

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Multi-line order items state
  const [items, setItems] = useState([
    {
      productId: preselectedProductId ? Number(preselectedProductId) : '',
      requestedQuantity: 10,
      minimumAcceptableQuantity: 5,
      partialDeliveryAllowed: true,
    },
  ]);

  // Form meta fields
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [businessNotes, setBusinessNotes] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoadingProducts(true);
      try {
        const res = await apiClient.get('/products?active=true');
        const prodList = res.data || [];
        setProducts(prodList);

        if (preselectedProductId && prodList.length > 0) {
          const match = prodList.find((p) => String(p.id) === String(preselectedProductId));
          if (match) {
            setItems([
              {
                productId: match.id,
                requestedQuantity: 10,
                minimumAcceptableQuantity: 5,
                partialDeliveryAllowed: true,
              },
            ]);
          }
        } else if (prodList.length > 0) {
          setItems((prev) => {
            if (prev.length === 1 && prev[0].productId === '') {
              return [
                {
                  productId: prodList[0].id,
                  requestedQuantity: 10,
                  minimumAcceptableQuantity: 5,
                  partialDeliveryAllowed: true,
                },
              ];
            }
            return prev;
          });
        }
      } catch (_err) {
        setError('Failed to fetch product catalog.');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchCatalog();
  }, [preselectedProductId]);

  const handleAddItem = () => {
    const defaultProduct = products.length > 0 ? products[0].id : '';
    setItems((prev) => [
      ...prev,
      {
        productId: defaultProduct,
        requestedQuantity: 10,
        minimumAcceptableQuantity: 5,
        partialDeliveryAllowed: true,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'productId') {
        item.productId = Number(value);
      } else if (field === 'requestedQuantity') {
        const num = Math.max(1, parseInt(value, 10) || 1);
        item.requestedQuantity = num;
      } else if (field === 'minimumAcceptableQuantity') {
        const num = parseInt(value, 10);
        item.minimumAcceptableQuantity = isNaN(num) ? '' : num;
      } else if (field === 'partialDeliveryAllowed') {
        item.partialDeliveryAllowed = Boolean(value);
        if (!value) {
          item.minimumAcceptableQuantity = item.requestedQuantity;
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (items.length === 0) {
      setError('At least one order line item is required.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      if (!itm.productId) {
        setError(`Line #${i + 1}: Please select a valid product.`);
        return;
      }
      if (itm.requestedQuantity <= 0) {
        setError(`Line #${i + 1}: Requested quantity must be greater than 0.`);
        return;
      }
      if (Number(itm.minimumAcceptableQuantity) > Number(itm.requestedQuantity)) {
        setError('Minimum acceptable quantity cannot exceed requested quantity.');
        return;
      }
      if (Number(itm.minimumAcceptableQuantity) <= 0) {
        setError(`Line #${i + 1}: Minimum acceptable quantity must be at least 1.`);
        return;
      }
    }

    // Check duplicate products
    const productIds = items.map((i) => i.productId);
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      setError('Each product can only appear once per order. Consolidate requested quantities into a single line.');
      return;
    }

    setSubmitting(true);
    try {
      // Generate unique idempotency key
      const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          product_id: i.productId,
          requestedQuantity: Number(i.requestedQuantity),
          requested_quantity: Number(i.requestedQuantity),
          minimumAcceptableQuantity: Number(i.minimumAcceptableQuantity),
          minimum_acceptable_quantity: Number(i.minimumAcceptableQuantity),
          partialDeliveryAllowed: i.partialDeliveryAllowed,
          partial_delivery_allowed: i.partialDeliveryAllowed,
        })),
        promisedDeliveryDate: promisedDeliveryDate || null,
        promised_delivery_date: promisedDeliveryDate || null,
        businessNotes: businessNotes.trim() || undefined,
        business_notes: businessNotes.trim() || undefined,
      };

      const res = await apiClient.post('/orders', payload, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });

      const createdOrder = res.data;
      navigate(`/orders/${createdOrder.id}`);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to submit order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-mono py-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-arcade-secondary mb-2">
            <Link to="/orders" className="hover:text-arcade-primary flex items-center space-x-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Orders</span>
            </Link>
            <span>/</span>
            <span className="text-arcade-accent">New Order</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Create Order Requisition
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Specify requested quantities and minimum partial thresholds for the allocation engine.
          </p>
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

      {loadingProducts ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-arcade-accent" />
          <span>Loading catalog...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Line Items Section */}
          <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-arcade-border pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-4 w-4 text-arcade-accent" />
                <h2 className="font-display text-base uppercase font-bold text-arcade-primary">
                  Order Line Items ({items.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center space-x-1 text-xs text-arcade-accent hover:underline uppercase tracking-wider"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-arcade-border bg-arcade-surface p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
                    {/* Product Selector */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
                        Product (SKU)
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full bg-arcade-neutral border border-arcade-border p-2 text-xs text-arcade-primary focus:border-arcade-accent focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Requested Quantity */}
                    <div>
                      <label htmlFor={`req-qty-${idx}`} className="block text-[10px] uppercase text-arcade-secondary mb-1">
                        Requested Quantity
                      </label>
                      <input
                        id={`req-qty-${idx}`}
                        type="number"
                        min="1"
                        value={item.requestedQuantity}
                        onChange={(e) => handleItemChange(idx, 'requestedQuantity', e.target.value)}
                        className="w-full bg-arcade-neutral border border-arcade-border p-2 text-xs text-arcade-primary focus:border-arcade-accent focus:outline-none"
                      />
                    </div>

                    {/* Minimum Acceptable Quantity */}
                    <div>
                      <label htmlFor={`min-qty-${idx}`} className="block text-[10px] uppercase text-arcade-secondary mb-1">
                        Min Acceptable Quantity
                      </label>
                      <input
                        id={`min-qty-${idx}`}
                        type="number"
                        min="1"
                        disabled={!item.partialDeliveryAllowed}
                        value={item.minimumAcceptableQuantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'minimumAcceptableQuantity', e.target.value)
                        }
                        className="w-full bg-arcade-neutral border border-arcade-border p-2 text-xs text-arcade-primary focus:border-arcade-accent focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Partial Delivery Toggle & Delete */}
                  <div className="flex items-center space-x-3 pt-2 md:pt-0">
                    <label className="flex items-center space-x-2 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={item.partialDeliveryAllowed}
                        onChange={(e) =>
                          handleItemChange(idx, 'partialDeliveryAllowed', e.target.checked)
                        }
                        className="accent-arcade-accent h-4 w-4"
                      />
                      <span className="text-[11px] text-arcade-secondary">Partial OK</span>
                    </label>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        title="Remove Line"
                        className="p-1.5 text-arcade-secondary hover:text-arcade-danger transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Notes Section */}
          <div className="border border-arcade-border bg-arcade-neutral p-5 space-y-4">
            <h2 className="font-display text-base uppercase font-bold text-arcade-primary border-b border-arcade-border pb-3">
              Delivery Commitments &amp; Notes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase text-arcade-secondary mb-1 flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-arcade-accent" />
                  <span>Promised Delivery Date</span>
                </label>
                <input
                  type="date"
                  value={promisedDeliveryDate}
                  onChange={(e) => setPromisedDeliveryDate(e.target.value)}
                  className="w-full bg-arcade-surface border border-arcade-border p-2.5 text-xs text-arcade-primary focus:border-arcade-accent focus:outline-none"
                />
                <span className="text-[10px] text-arcade-secondary mt-1 block">
                  Delivery priority tie-breaks favor earlier committed dates.
                </span>
              </div>

              <div>
                <label className="block text-xs uppercase text-arcade-secondary mb-1 flex items-center space-x-1">
                  <FileText className="h-3 w-3 text-arcade-accent" />
                  <span>Business Notes / Contract Context</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Turnaround milestone delivery; penalty clause if deferred."
                  value={businessNotes}
                  onChange={(e) => setBusinessNotes(e.target.value)}
                  className="w-full bg-arcade-surface border border-arcade-border p-2.5 text-xs text-arcade-primary focus:border-arcade-accent focus:outline-none placeholder-arcade-secondary/50"
                />
                <span className="text-[10px] text-arcade-secondary mt-1 block">
                  Reviewed by AI Priority Assistant and Operations Team.
                </span>
              </div>
            </div>
          </div>

          {/* Submission Panel */}
          <div className="border border-arcade-border bg-arcade-neutral p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-arcade-secondary flex items-center space-x-2">
              <Check className="h-4 w-4 text-arcade-accent" />
              <span>
                Protected with Idempotency Key • Default queue status is pending.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-arcade-accent text-arcade-surface font-extrabold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity shadow-[0_0_12px_rgba(200,255,58,0.3)]"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Order for Allocation</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
