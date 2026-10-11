import React from 'react';
import { Package } from 'lucide-react';

export default function ProductManagement() {
  return (
    <div className="border border-arcade-border bg-arcade-neutral p-8 text-center font-mono">
      <Package className="w-8 h-8 text-arcade-accent mx-auto mb-2" />
      <h2 className="text-xl font-bold uppercase text-arcade-primary">Product Management</h2>
      <p className="text-xs text-arcade-secondary mt-1">Catalog, SKU definitions, and supplier linkages.</p>
    </div>
  );
}
