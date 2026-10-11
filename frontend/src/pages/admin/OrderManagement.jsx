import React from 'react';
import { ClipboardList } from 'lucide-react';

export default function OrderManagement() {
  return (
    <div className="border border-arcade-border bg-arcade-neutral p-8 text-center font-mono">
      <ClipboardList className="w-8 h-8 text-arcade-accent mx-auto mb-2" />
      <h2 className="text-xl font-bold uppercase text-arcade-primary">Order Management</h2>
      <p className="text-xs text-arcade-secondary mt-1">Review competing customer orders and promised delivery commitments.</p>
    </div>
  );
}
