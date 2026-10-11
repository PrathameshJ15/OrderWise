import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';

export default function PlaceholderLayout() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/health');
      setHealth(res.data);
    } catch (err) {
      setError(err?.error?.message || err?.message || 'Failed to reach backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-arcade-surface text-arcade-primary flex flex-col font-mono selection:bg-arcade-accent selection:text-arcade-surface">
      {/* Top Navbar */}
      <header className="border-b border-arcade-border bg-arcade-neutral/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-arcade-accent text-arcade-surface flex items-center justify-center font-display font-extrabold text-xl shadow-[0_0_12px_rgba(200,255,58,0.4)]">
              OW
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-black text-2xl tracking-wider text-arcade-primary uppercase">
                  OrderWise
                </span>
                <span className="text-[10px] tracking-widest px-1.5 py-0.5 bg-arcade-surface border border-arcade-border text-arcade-accent font-semibold uppercase">
                  VORTEXA 3.0
                </span>
              </div>
              <p className="text-[11px] text-arcade-secondary hidden sm:block">
                AI recommends. Business rules validate. Humans approve. OrderWise allocates.
              </p>
            </div>
          </div>

          {/* Backend Connectivity Status Badge */}
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 border text-xs uppercase tracking-wider ${
                loading
                  ? 'border-arcade-border text-arcade-secondary bg-arcade-surface'
                  : health
                  ? 'border-arcade-accent/30 bg-arcade-accent/10 text-arcade-accent'
                  : 'border-arcade-danger/40 bg-arcade-danger/10 text-arcade-danger'
              }`}
            >
              {loading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : health ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              <span className="font-semibold">
                {loading
                  ? 'Probing API...'
                  : health
                  ? `API Connected (${health.status})`
                  : 'API Disconnected'}
              </span>
            </div>

            <button
              onClick={fetchHealth}
              title="Refresh API Status"
              className="p-1.5 border border-arcade-border text-arcade-secondary hover:text-arcade-accent hover:border-arcade-accent transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Outlet context={{ health, loading, error, refreshHealth: fetchHealth }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-arcade-border bg-arcade-neutral/40 py-6 px-6 text-xs text-arcade-secondary">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>OrderWise Platform • Problem Statement S-03 • 2026</span>
          <div className="flex items-center space-x-4">
            <span className="text-arcade-secondary/60">Node 20 • React 18 • PostgreSQL 15 • Groq Llama-3</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
