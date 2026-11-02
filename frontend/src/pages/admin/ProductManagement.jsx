import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  Database,
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
    <div className="space-y-6 font-sans py-2">
      {/* Header Card */}
      <div className="card-base flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[12px] font-mono text-ac font-medium mb-1">
            <Package className="h-3.5 w-3.5" />
            <span>Operational catalog control</span>
          </div>
          <h1 className="text-[34px] font-bold tracking-[-0.02em] text-white">
            Product Management
          </h1>
          <p className="text-[14px] text-t2 mt-0.5">
            Maintain catalog hardware specifications, SKU identifiers, and lifecycle activation states.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <Link
            to="/admin/inventory"
            className="btn-secondary min-h-[44px] px-4 text-[14px] flex items-center space-x-2"
          >
            <Database className="h-4 w-4 text-ac" />
            <span>Inventory Hub &rarr;</span>
          </Link>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-card border border-no/30 bg-[#291313] text-no text-[13px] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="underline hover:text-white text-[12px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-base flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Active status filter */}
        <div className="flex items-center space-x-1.5 border border-bd rounded-pill bg-s2 p-1 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1 text-[12px] font-mono font-medium rounded-pill whitespace-nowrap transition-colors ${
              activeFilter === 'all'
                ? 'bg-ac text-white'
                : 'text-t2 hover:text-white'
            }`}
          >
            All products ({products.length})
          </button>
          <button
            onClick={() => setActiveFilter('true')}
            className={`px-3.5 py-1 text-[12px] font-mono font-medium rounded-pill whitespace-nowrap transition-colors ${
              activeFilter === 'true'
                ? 'bg-ac text-white'
                : 'text-t2 hover:text-white'
            }`}
          >
            Active only
          </button>
          <button
            onClick={() => setActiveFilter('false')}
            className={`px-3.5 py-1 text-[12px] font-mono font-medium rounded-pill whitespace-nowrap transition-colors ${
              activeFilter === 'false'
                ? 'bg-ac text-white'
                : 'text-t2 hover:text-white'
            }`}
          >
            Inactive
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 border border-bd rounded-pill bg-s2 px-4 py-2 text-sm w-full md:w-72">
          <Search className="h-4 w-4 text-t2" />
          <input
            type="text"
            placeholder="Search SKU or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-[14px] w-full placeholder-t2/50 font-sans"
          />
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="card-base p-12 text-center text-t2 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-ac" />
          <span className="text-[12px] font-mono">Loading product records...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="card-base p-12 text-center text-t2 space-y-3">
          <Package className="h-8 w-8 text-t2 mx-auto opacity-50" />
          <h3 className="text-[18px] text-white font-bold">
            No products found
          </h3>
          <p className="text-[14px]">No catalog entries match your query.</p>
        </div>
      ) : (
        <div className="card-base overflow-x-auto p-0">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-bd text-t2 font-mono text-[12px]">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3 text-right">Physical On Hand</th>
                <th className="py-3 px-3 text-right">Reserved</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bd/60">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-s2/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {p.sku}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="text-[12px] text-t2 truncate max-w-sm">
                      {p.description || '—'}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-t2 font-mono text-[12px]">
                    {p.unit || 'units'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-semibold text-white">
                    {p.on_hand_quantity ?? p.stock ?? '—'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-t2">
                    {p.reserved_quantity ?? 0}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-pill border ${
                        p.active
                          ? 'border-ok/30 text-ok bg-ok/10'
                          : 'border-bd text-t2 bg-s2'
                      }`}
                    >
                      {p.active ? <CheckCircle2 className="h-3 w-3" /> : null}
                      <span>{p.active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-full border border-bd text-t2 hover:text-white hover:border-white transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {p.active && (
                      <button
                        onClick={() => handleDeactivate(p.id)}
                        className="p-1.5 rounded-full border border-bd text-t2 hover:text-no hover:border-no transition-colors"
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
        <form onSubmit={handleCreateProduct} className="space-y-4 text-sm font-sans">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-mono text-t2 mb-1.5">
                SKU Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SENSOR-T500"
                value={createForm.sku}
                onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })}
                className="w-full bg-s2 border border-bd rounded-pill px-4 py-2.5 text-white focus:border-white focus:outline-none font-mono text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-mono text-t2 mb-1.5">
                Unit of Measure
              </label>
              <input
                type="text"
                placeholder="e.g. units, kg, meters"
                value={createForm.unit}
                onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })}
                className="w-full bg-s2 border border-bd rounded-pill px-4 py-2.5 text-white focus:border-white focus:outline-none font-sans text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Temperature Sensor Array"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full bg-s2 border border-bd rounded-pill px-4 py-2.5 text-white focus:border-white focus:outline-none font-sans text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Description
            </label>
            <textarea
              rows="2"
              placeholder="Hardware details, specifications..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full bg-s2 border border-bd rounded-card p-3 text-white focus:border-white focus:outline-none font-sans text-[14px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-mono text-t2 mb-1.5">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={createForm.initialStock}
                onChange={(e) => setCreateForm({ ...createForm, initialStock: e.target.value })}
                className="w-full bg-s2 border border-bd rounded-pill px-4 py-2 text-white focus:border-white focus:outline-none font-mono text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-mono text-t2 mb-1.5">
                Safety Stock
              </label>
              <input
                type="number"
                min="0"
                value={createForm.safetyStock}
                onChange={(e) => setCreateForm({ ...createForm, safetyStock: e.target.value })}
                className="w-full bg-s2 border border-bd rounded-pill px-4 py-2 text-white focus:border-white focus:outline-none font-mono text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-mono text-t2 mb-1.5">
                Reorder Point
              </label>
              <input
                type="number"
                min="0"
                value={createForm.reorderPoint}
                onChange={(e) => setCreateForm({ ...createForm, reorderPoint: e.target.value })}
                className="w-full bg-s2 border border-bd rounded-pill px-4 py-2 text-white focus:border-white focus:outline-none font-mono text-[14px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-bd">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn-secondary min-h-[40px] px-4 text-[13px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="btn-primary min-h-[40px] px-5 text-[13px] disabled:opacity-50"
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
        <form onSubmit={handleUpdateProduct} className="space-y-4 text-sm font-sans">
          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full bg-s2 border border-bd rounded-pill px-4 py-2.5 text-white focus:border-white focus:outline-none font-sans text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Unit of Measure
            </label>
            <input
              type="text"
              value={editForm.unit}
              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
              className="w-full bg-s2 border border-bd rounded-pill px-4 py-2.5 text-white focus:border-white focus:outline-none font-sans text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono text-t2 mb-1.5">
              Description
            </label>
            <textarea
              rows="3"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full bg-s2 border border-bd rounded-card p-3 text-white focus:border-white focus:outline-none font-sans text-[14px]"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setEditForm({ ...editForm, active: !editForm.active })}
              className="flex items-center space-x-2 text-[13px]"
            >
              {editForm.active ? (
                <ToggleRight className="h-6 w-6 text-ok" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-t2" />
              )}
              <span className="font-medium text-white">
                {editForm.active ? 'Product is Active' : 'Product is Inactive'}
              </span>
            </button>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-bd">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="btn-secondary min-h-[40px] px-4 text-[13px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="btn-primary min-h-[40px] px-5 text-[13px] disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
