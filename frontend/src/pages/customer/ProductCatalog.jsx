import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Toast from '../../components/ui/Toast';
import {
  Search,
  Filter,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export function ProductCatalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);
      try {
        const res = await apiClient.get('/products');
        const list = res.products || res.data?.products || res;
        if (isMounted) {
          setProducts(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load products:', err);
          setErrorMessage(err.error?.message || err.message || 'Failed to load catalog');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products by search and stock
  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query));

    const matchesStock = !inStockOnly || p.available_stock > 0;
    return matchesSearch && matchesStock;
  });

  const getStockIndicator = (product) => {
    const avail = product.available_stock;
    const onHand = product.on_hand_quantity;

    if (avail <= 0) {
      return {
        badge: 'Out of Stock',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        barColor: 'bg-rose-500',
        icon: AlertTriangle,
        percentage: 0,
      };
    }

    if (avail <= 15 || (onHand > 0 && avail / onHand < 0.2)) {
      return {
        badge: 'Scarce / Low Stock',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        barColor: 'bg-amber-500',
        icon: Flame,
        percentage: Math.min(100, Math.round((avail / (onHand || 1)) * 100)),
      };
    }

    return {
      badge: 'In Stock',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-500',
      icon: CheckCircle,
      percentage: Math.min(100, Math.round((avail / (onHand || 1)) * 100)),
    };
  };

  const handleOrderClick = (productId) => {
    navigate(`/orders/new?product_id=${productId}`);
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Toast message={errorMessage} type="error" onClose={() => setErrorMessage('')} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore certified industrial hardware with live stock levels ready for prioritized allocation.
          </p>
        </div>

        {/* Search & Stock Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative min-w-[260px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product or SKU..."
              className="block w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 bg-white shadow-xs focus:ring-indigo-500 focus:border-indigo-500 transition"
              aria-label="Search products"
            />
          </div>

          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-300 shadow-xs cursor-pointer select-none hover:bg-slate-50 transition text-sm text-slate-700">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
            />
            <span className="font-medium">In stock only</span>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="No products matched your criteria"
          description="Try loosening your search terms or uncheck the 'In stock only' filter."
          actionText="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setInStockOnly(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const stockInfo = getStockIndicator(product);
            const StockIcon = stockInfo.icon;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
                      {product.sku}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${stockInfo.badgeClass}`}
                    >
                      <StockIcon className="w-3 h-3" />
                      {stockInfo.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {product.description || 'No extended description available for this catalog item.'}
                  </p>

                  {/* Stock Metrics Box */}
                  <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Available to allocate:</span>
                      <span className="font-bold text-slate-900">
                        {product.available_stock} {product.unit || 'units'}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stockInfo.barColor}`}
                        style={{ width: `${stockInfo.percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>On hand: {product.on_hand_quantity}</span>
                      <span>Reserved: {product.reserved_quantity}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Unit: {product.unit || 'units'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOrderClick(product.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <span>Order Item</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductCatalog;
