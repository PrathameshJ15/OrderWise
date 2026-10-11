import React, { useState } from 'react';
import { Sliders, RefreshCw, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/client';

export default function AllocationCenter() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await apiClient.post('/allocation/run', { product_ids: 'all', notes: 'Manual trigger from Allocation Center' });
      setResult(res.data);
    } catch (err) {
      console.warn(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="border border-arcade-border bg-arcade-neutral p-6">
        <h1 className="font-display text-2xl font-black uppercase text-arcade-primary">Deterministic Allocation Center</h1>
        <p className="text-xs text-arcade-secondary mt-1">Execute allocation engine across all eligible customer orders.</p>
        <button
          onClick={handleRun}
          disabled={running}
          className="mt-4 px-4 py-2 bg-arcade-accent text-arcade-surface font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Allocating...' : 'Run Allocation Engine'}</span>
        </button>
      </div>

      {result && (
        <div className="border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-400">
          <div className="flex items-center space-x-2 font-bold uppercase">
            <CheckCircle2 className="w-4 h-4" />
            <span>Allocation Completed — Run #{result.run?.id}</span>
          </div>
          <p className="mt-1 text-arcade-secondary">Processed {result.summary?.total_items_processed} items ({result.summary?.fulfilled} fulfilled, {result.summary?.partially_fulfilled} partial, {result.summary?.deferred} deferred).</p>
        </div>
      )}
    </div>
  );
}
