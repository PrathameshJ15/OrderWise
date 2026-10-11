import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, ShoppingCart, RefreshCw, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import apiClient from '../../api/client';

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/products?active=true');
      setProducts(res.data || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to load product catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <Package className="h-3 w-3" />
            <span>AVAILABLE INDUSTRIAL CATALOG</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Product Catalog
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Certified industrial hardware with live warehouse availability indicators.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 border border-arcade-border bg-arcade-surface px-3 py-2 text-xs w-full md:w-72">
          <Search className="h-3.5 w-3.5 text-arcade-secondary" />
          <input
            type="text"
            placeholder="Search by SKU or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-arcade-primary focus:outline-none text-xs w-full placeholder-arcade-secondary/60"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 border border-arcade-danger/40 bg-arcade-danger/10 text-arcade-danger text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Catalog Grid */}
      {loading ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-arcade-accent" />
          <span className="text-xs tracking-wider uppercase">Loading catalog components...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary space-y-2">
          <Package className="h-8 w-8 text-arcade-secondary mx-auto opacity-50" />
          <h3 className="font-display text-base uppercase text-arcade-primary font-bold">
            No Matching Products
          </h3>
          <p className="text-xs">No active products match your current search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const onHand = product.on_hand_quantity || product.stock || 0;
            const available = product.available_quantity ?? onHand;

            // Availability rating based on FRONTEND_SPEC.md:
            // green (>20%), yellow (5-20%), red (<5% or 0)
            let indicatorColor = 'border-arcade-accent text-arcade-accent bg-arcade-accent/10';
            let indicatorText = 'In Stock';
            let IndicatorIcon = CheckCircle2;

            if (available <= 0) {
              indicatorColor = 'border-arcade-danger text-arcade-danger bg-arcade-danger/10';
              indicatorText = 'Scarce / Exhausted';
              IndicatorIcon = AlertOctagon;
            } else if (available < 15) {
              indicatorColor = 'border-arcade-warning text-arcade-warning bg-arcade-warning/10';
              indicatorText = 'Limited Supply';
              IndicatorIcon = AlertTriangle;
            }

            return (
              <div
                key={product.id}
                className="border border-arcade-border bg-arcade-neutral p-5 flex flex-col justify-between hover:border-arcade-accent/60 transition-colors group relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] text-arcade-accent font-bold px-1.5 py-0.5 bg-arcade-surface border border-arcade-border">
                      {product.sku}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 text-[9px] uppercase font-bold px-1.5 py-0.5 border ${indicatorColor}`}
                    >
                      <IndicatorIcon className="h-2.5 w-2.5" />
                      <span>{indicatorText}</span>
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-arcade-primary group-hover:text-arcade-accent transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-xs text-arcade-secondary mt-1 mb-4 line-clamp-3 leading-relaxed">
                    {product.description || 'Standard precision industrial hardware component.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-arcade-border/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-arcade-secondary text-[11px]">Warehouse Units:</span>
                    <span className="font-semibold text-arcade-primary">
                      {available} <span className="text-[10px] text-arcade-secondary">{product.unit || 'units'}</span>
                    </span>
                  </div>

                  <Link
                    to={`/orders/new?product_id=${product.id}`}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_8px_rgba(200,255,58,0.2)]"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Order Now</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
