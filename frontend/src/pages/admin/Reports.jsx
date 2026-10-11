import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function Reports() {
  return (
    <div className="border border-arcade-border bg-arcade-neutral p-8 text-center font-mono">
      <BarChart3 className="w-8 h-8 text-arcade-accent mx-auto mb-2" />
      <h2 className="text-xl font-bold uppercase text-arcade-primary">Executive Summary & Reports</h2>
      <p className="text-xs text-arcade-secondary mt-1">Aggregate allocation rates, supplier reliability, and order fulfillment metrics.</p>
    </div>
  );
}
