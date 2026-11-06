import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  Sparkles,
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
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);

  const handleParseAiOrder = async () => {
    if (!aiPrompt.trim() || aiParsing) return;
    setAiParsing(true);
    setError(null);
    setAiNotice(null);

    try {
      const res = await apiClient.post('/customer/ai/parse-order-prompt', {
        prompt: aiPrompt.trim(),
      });

      const data = res?.data || res;
      const draft = data?.draft_items || [];

      if (draft.length > 0) {
        setItems(
          draft.map((d) => ({
            productId: d.product_id,
            requestedQuantity: d.requested_quantity || 10,
            minimumAcceptableQuantity: d.minimum_acceptable_quantity || 5,
            partialDeliveryAllowed: d.partial_delivery_allowed ?? true,
          }))
        );

        if (data.suggested_delivery_date) {
          setPromisedDeliveryDate(data.suggested_delivery_date);
        }
        if (data.suggested_notes) {
          setBusinessNotes(data.suggested_notes);
        }

        setAiNotice(`Matched ${draft.length} industrial product(s). Please review and adjust the quantities below before confirming.`);
      } else {
        setError('No recognized products found in your prompt. You can select products manually below or try specifying industrial hardware like PLC, Pressure Sensor, or Motor.');
      }
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to parse natural language order.');
    } finally {
      setAiParsing(false);
    }
  };

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
    <div className="space-y-6 font-sans py-2 max-w-4xl mx-auto">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-2 text-[12px] font-sans text-t2 mb-1.5">
            <Link to="/orders" className="hover:text-t flex items-center space-x-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Orders</span>
            </Link>
            <span>/</span>
            <span className="text-t">New order</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-t">
            Create Order Requisition
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5">
            Specify requested quantities and minimum partial thresholds for the allocation engine.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/30 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline hover:text-t text-[12px]">
            Dismiss
          </button>
        </div>
      )}

      {loadingProducts ? (
        <div className="card-base p-12 text-center text-t2 flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-ac" />
          <span className="font-mono text-[12px]">Loading catalog...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feature D: AI Natural Language Order Creation Assistant */}
          <div className="card-base p-5 border-ac/30 bg-gradient-to-r from-s to-s2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-ac/10 text-ac flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-t flex items-center space-x-2">
                  <span>AI Order Creation Assistant</span>
                  <span className="text-[11px] font-mono text-ac px-2 py-0.5 rounded-pill bg-ac/10 border border-ac/20">
                    Natural Language Draft
                  </span>
                </h3>
                <p className="text-[12.5px] text-t2 font-sans">
                  Describe what your facility needs in plain English. AI matches components against the industrial catalog.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. I need 20 PLC Control Modules and 10 Industrial Pressure Sensors by next week"
                className="flex-1 bg-s border border-bd rounded-pill px-4 py-2.5 text-[13.5px] text-t placeholder-t2/50 focus:outline-none focus:border-ac transition-colors font-sans"
              />
              <button
                type="button"
                disabled={aiParsing || !aiPrompt.trim()}
                onClick={handleParseAiOrder}
                className="btn-primary min-h-[40px] px-5 text-[13px] whitespace-nowrap flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {aiParsing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Parsing Catalog...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Draft</span>
                  </>
                )}
              </button>
            </div>

            {aiNotice && (
              <div className="text-[12px] font-mono text-ok bg-ok/10 border border-ok/20 rounded-pill px-3 py-1.5 flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>{aiNotice}</span>
              </div>
            )}
          </div>
          {/* Line Items Section */}
          <div className="card-base space-y-4">
            <div className="flex items-center justify-between border-b border-bd pb-4">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-4 w-4 text-ac" />
                <h2 className="text-[20px] font-bold text-t">
                  Order line items ({items.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-secondary min-h-[38px] px-3.5 text-[13px] flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add item line</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-s2 border border-bd rounded-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
                    {/* Product Selector */}
                    <div className="sm:col-span-2">
                      <label className="block text-[13px] font-sans font-medium text-t2 mb-1.5">
                        Product (SKU)
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full bg-s border border-bd rounded-pill px-4 py-2.5 text-[14px] text-t focus:border-ac focus:outline-none font-sans"
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
                      <label htmlFor={`req-qty-${idx}`} className="block text-[13px] font-sans font-medium text-t2 mb-1.5">
                        Requested Quantity
                      </label>
                      <input
                        id={`req-qty-${idx}`}
                        type="number"
                        min="1"
                        value={item.requestedQuantity}
                        onChange={(e) => handleItemChange(idx, 'requestedQuantity', e.target.value)}
                        className="w-full bg-s border border-bd rounded-pill px-4 py-2.5 text-[14px] text-t focus:border-ac focus:outline-none font-mono"
                      />
                    </div>

                    {/* Minimum Acceptable Quantity */}
                    <div>
                      <label htmlFor={`min-qty-${idx}`} className="block text-[13px] font-sans font-medium text-t2 mb-1.5">
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
                        className="w-full bg-s border border-bd rounded-pill px-4 py-2.5 text-[14px] text-t focus:border-ac focus:outline-none font-mono disabled:opacity-40"
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
                        className="accent-ac h-4 w-4 rounded cursor-pointer"
                      />
                      <span className="text-[13px] font-sans font-medium text-t2">Partial OK</span>
                    </label>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        title="Remove Line"
                        className="p-1.5 rounded-full text-t2 hover:text-no hover:bg-s transition-colors"
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
          <div className="card-base space-y-4">
            <h2 className="text-[20px] font-bold text-t border-b border-bd pb-4">
              Delivery commitments &amp; notes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-sans font-medium text-t2 mb-1.5 flex items-center space-x-1.5">
                  <Calendar className="h-3.5 w-3.5 text-ac" />
                  <span>Promised Delivery Date</span>
                </label>
                <input
                  type="date"
                  value={promisedDeliveryDate}
                  onChange={(e) => setPromisedDeliveryDate(e.target.value)}
                  className="w-full bg-s2 border border-bd rounded-pill px-4 py-2.5 text-[14px] text-t focus:border-ac focus:outline-none font-sans"
                />
                <span className="text-[11px] font-mono text-t2 mt-1 block">
                  Delivery priority tie-breaks favor earlier committed dates.
                </span>
              </div>

              <div>
                <label className="block text-[13px] font-sans font-medium text-t2 mb-1.5 flex items-center space-x-1.5">
                  <FileText className="h-3.5 w-3.5 text-ac" />
                  <span>Business Notes / Contract Context</span>
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Turnaround milestone delivery; penalty clause if deferred."
                  value={businessNotes}
                  onChange={(e) => setBusinessNotes(e.target.value)}
                  className="w-full bg-s2 border border-bd rounded-[12px] p-3 text-[14px] text-t focus:border-ac focus:outline-none placeholder-t2/50 font-sans"
                />
                <span className="text-[11px] font-mono text-t2 mt-1 block">
                  Reviewed by AI Priority Assistant and operations team.
                </span>
              </div>
            </div>
          </div>

          {/* Submission Panel */}
          <div className="card-base flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[12px] font-mono text-t2 flex items-center space-x-2">
              <Check className="h-4 w-4 text-ok" />
              <span>
                Protected with idempotency key • Default queue status is pending.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full sm:w-auto px-6 py-3 space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Submitting order...</span>
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
