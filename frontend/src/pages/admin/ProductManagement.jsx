import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import apiClient from '../../api/client';
import Modal from '../../components/ui/Modal';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'true' | 'false'

  // Create Product Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    sku: '',
    name: '',
    description: '',
    unit: 'units',
    initialStock: 100,
    safetyStock: 15,
    reorderPoint: 30,
  });
  const [creating, setCreating] = useState(false);

  // Edit Product Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    unit: 'units',
    active: true,
  });
  const [updating, setUpdating] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (activeFilter !== 'all') params.active = activeFilter;
      const res = await apiClient.get('/products', { params });
      setProducts(res.data || []);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiClient.post('/products', {
        sku: createForm.sku.trim().toUpperCase(),
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        unit: createForm.unit.trim() || 'units',
        initialStock: Number(createForm.initialStock),
        safetyStock: Number(createForm.safetyStock),
        reorderPoint: Number(createForm.reorderPoint),
      });
      setCreateModalOpen(false);
      setCreateForm({
        sku: '',
        name: '',
        description: '',
        unit: 'units',
        initialStock: 100,
        safetyStock: 15,
        reorderPoint: 30,
      });
      await fetchProducts();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to create product.');
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      description: p.description || '',
      unit: p.unit || 'units',
      active: p.active,
    });
    setEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setUpdating(true);
    setError(null);
    try {
      await apiClient.put(`/products/${editingProduct.id}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        unit: editForm.unit.trim(),
        active: editForm.active,
      });
      setEditModalOpen(false);
      await fetchProducts();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to update product.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeactivate = async (productId) => {
    if (!window.confirm('Are you sure you want to soft-delete / deactivate this product?')) return;
    try {
      await apiClient.delete(`/products/${productId}`);
      await fetchProducts();
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to deactivate product.');
    }
  };

  return (
    <div className="space-y-6 font-mono py-4">
      {/* Header */}
      <div className="border border-arcade-border bg-arcade-neutral p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-arcade-accent bg-arcade-accent/10 border border-arcade-accent/20 px-2 py-0.5 mb-2">
            <Package className="h-3 w-3" />
            <span>OPERATIONAL CATALOG CONTROL</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold uppercase text-arcade-primary">
            Product Management
          </h1>
          <p className="text-xs text-arcade-secondary mt-1">
            Maintain catalog hardware specifications, SKU identifiers, and lifecycle activation states.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity self-start md:self-auto shadow-[0_0_12px_rgba(200,255,58,0.25)]"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
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

      {/* Filter and Search Bar */}
      <div className="border border-arcade-border bg-arcade-neutral p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Active status filter */}
        <div className="flex items-center space-x-1 border border-arcade-border bg-arcade-surface p-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
              activeFilter === 'all'
                ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                : 'text-arcade-secondary hover:text-arcade-primary'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setActiveFilter('true')}
            className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
              activeFilter === 'true'
                ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                : 'text-arcade-secondary hover:text-arcade-primary'
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => setActiveFilter('false')}
            className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
              activeFilter === 'false'
                ? 'bg-arcade-neutral text-arcade-accent font-bold border border-arcade-border'
                : 'text-arcade-secondary hover:text-arcade-primary'
            }`}
          >
            Inactive
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 border border-arcade-border bg-arcade-surface px-3 py-1.5 text-xs w-full md:w-64">
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

      {/* Products Table */}
      {loading ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-arcade-accent" />
          <span className="text-xs uppercase tracking-wider">Loading product records...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="border border-arcade-border bg-arcade-neutral p-12 text-center text-arcade-secondary space-y-3">
          <Package className="h-8 w-8 text-arcade-secondary mx-auto opacity-50" />
          <h3 className="font-display text-base uppercase text-arcade-primary font-bold">
            No Products Found
          </h3>
          <p className="text-xs">No catalog entries match your query.</p>
        </div>
      ) : (
        <div className="border border-arcade-border bg-arcade-neutral overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-arcade-border bg-arcade-surface/60 text-arcade-secondary uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3 text-right">Physical On Hand</th>
                <th className="py-3 px-3 text-right">Reserved</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arcade-border/50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-arcade-surface/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-arcade-accent">
                    {p.sku}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-arcade-primary">{p.name}</div>
                    <div className="text-[10px] text-arcade-secondary truncate max-w-sm">
                      {p.description || '—'}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-arcade-secondary">
                    {p.unit || 'units'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold text-arcade-primary">
                    {p.on_hand_quantity ?? p.stock ?? '—'}
                  </td>
                  <td className="py-3.5 px-3 text-right text-arcade-secondary">
                    {p.reserved_quantity ?? 0}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[9px] uppercase font-bold border tracking-wider ${
                        p.active
                          ? 'border-arcade-accent/40 text-arcade-accent bg-arcade-accent/10'
                          : 'border-arcade-border text-arcade-secondary bg-arcade-surface'
                      }`}
                    >
                      {p.active ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
                      <span>{p.active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1 border border-arcade-border text-arcade-secondary hover:text-arcade-accent hover:border-arcade-accent transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {p.active && (
                      <button
                        onClick={() => handleDeactivate(p.id)}
                        className="p-1 border border-arcade-border text-arcade-secondary hover:text-arcade-danger hover:border-arcade-danger transition-colors"
                        title="Deactivate Product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Product Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Catalog Product"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
                SKU Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SENSOR-T500"
                value={createForm.sku}
                onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })}
                className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                placeholder="e.g. units, kg, meters"
                value={createForm.unit}
                onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })}
                className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Temperature Sensor Array"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
              Description
            </label>
            <textarea
              rows="2"
              placeholder="Hardware details, specifications..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={createForm.initialStock}
                onChange={(e) => setCreateForm({ ...createForm, initialStock: e.target.value })}
                className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
                Safety Stock
              </label>
              <input
                type="number"
                min="0"
                value={createForm.safetyStock}
                onChange={(e) => setCreateForm({ ...createForm, safetyStock: e.target.value })}
                className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
                Reorder Point
              </label>
              <input
                type="number"
                min="0"
                value={createForm.reorderPoint}
                onChange={(e) => setCreateForm({ ...createForm, reorderPoint: e.target.value })}
                className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-arcade-border">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-1.5 border border-arcade-border text-arcade-secondary uppercase text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-1.5 bg-arcade-accent text-arcade-surface font-bold uppercase text-xs hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'Saving...' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Product: ${editingProduct?.sku}`}
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
              Unit of Measure
            </label>
            <input
              type="text"
              value={editForm.unit}
              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-arcade-secondary mb-1">
              Description
            </label>
            <textarea
              rows="3"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full bg-arcade-surface border border-arcade-border p-2 text-arcade-primary focus:border-arcade-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setEditForm({ ...editForm, active: !editForm.active })}
              className="flex items-center space-x-2 text-xs"
            >
              {editForm.active ? (
                <ToggleRight className="h-6 w-6 text-arcade-accent" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-arcade-secondary" />
              )}
              <span className="uppercase text-[11px] text-arcade-primary">
                {editForm.active ? 'Product is Active' : 'Product is Inactive'}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-arcade-border">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-3 py-1.5 border border-arcade-border text-arcade-secondary uppercase text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-1.5 bg-arcade-accent text-arcade-surface font-bold uppercase text-xs hover:opacity-90 disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
