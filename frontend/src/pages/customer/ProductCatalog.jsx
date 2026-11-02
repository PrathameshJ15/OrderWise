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
    <div className="space-y-6 font-sans py-2">
      {/* Clean Page Header (No excessive bordered box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-[12px] font-mono text-ac font-semibold tracking-wider uppercase mb-1">
            <Package className="h-3.5 w-3.5" />
            <span>Available industrial catalog</span>
          </div>
          <h1 className="font-display text-[34px] font-bold tracking-tight text-white">
            Product Catalog
          </h1>
          <p className="text-[14px] text-t2 font-sans mt-0.5">
            Certified industrial hardware with live warehouse availability indicators.
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 border border-bd rounded-pill bg-s2 px-4 py-2.5 text-sm w-full md:w-80">
          <Search className="h-4 w-4 text-t2" />
          <input
            type="text"
            placeholder="Search catalog by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-[14px] w-full placeholder-t2/50 font-sans"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/30 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Catalog Grid */}
      {loading ? (
        <div className="card-base p-12 text-center text-t2 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-ac" />
          <span className="text-[12px] font-mono">Loading catalog components...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card-base p-12 text-center text-t2 space-y-2">
          <Package className="h-8 w-8 text-t2 mx-auto opacity-50" />
          <h3 className="text-[18px] text-white font-bold">
            No matching products
          </h3>
          <p className="text-[14px]">No active products match your current search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const onHand = product.on_hand_quantity || product.stock || 0;
            const available = product.available_quantity ?? onHand;

            let indicatorColor = 'border-ok/30 text-ok bg-ok/10';
            let indicatorText = 'In Stock';
            let IndicatorIcon = CheckCircle2;

            if (available <= 0) {
              indicatorColor = 'border-no/30 text-no bg-no/10';
              indicatorText = 'Scarce / Exhausted';
              IndicatorIcon = AlertOctagon;
            } else if (available < 15) {
              indicatorColor = 'border-wa/30 text-wa bg-wa/10';
              indicatorText = 'Limited Supply';
              IndicatorIcon = AlertTriangle;
            }

            return (
              <div
                key={product.id}
                className="card-base flex flex-col justify-between hover:border-white transition-colors group relative space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[12px] text-t2 px-2.5 py-0.5 rounded-pill bg-s2 border border-bd">
                      {product.sku}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-pill border ${indicatorColor}`}
                    >
                      <IndicatorIcon className="h-3 w-3" />
                      <span>{indicatorText}</span>
                    </span>
                  </div>

                  <h3 className="text-[18px] font-bold text-white group-hover:text-ac transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[13px] text-t2 mt-1 line-clamp-2 leading-relaxed">
                    {product.description || 'Industrial equipment component with standard enterprise specifications.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-bd space-y-3">
                  <div className="flex items-center justify-between text-[12px] font-mono text-t2">
                    <span>Available stock:</span>
                    <span className="text-white font-semibold text-[14px]">{available} units</span>
                  </div>

                  <Link
                    to={`/orders/new?product_id=${product.id}`}
                    className="btn-primary w-full py-2.5 space-x-2 text-[14px]"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Request In Order</span>
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
