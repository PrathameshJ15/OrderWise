import React, { useState, useEffect } from 'react';
import PublicNavbar from '../components/layout/PublicNavbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight } from 'lucide-react';
import IsometricWarehouseVisual from '../components/3d/IsometricWarehouseVisual';
import AmbientLighting from '../components/ui/AmbientLighting';
import apiClient from '../api/client';

export default function Home() {
  const { user } = useAuth();
  const [heroRightTab, setHeroRightTab] = useState('queue');
  const [productHeader, setProductHeader] = useState({
    name: 'Pressure Gauge Pro',
    sku: 'GAUGE-P300',
    onHand: 40,
  });
  const [queueOrders, setQueueOrders] = useState([
    {
      id: 103,
      customer_name: 'Charlie',
      order_id: 103,
      requested_quantity: 30,
      allocated_quantity: 30,
      status: 'fulfilled',
      minimum_acceptable_quantity: 10,
      partial_delivery_allowed: true,
    },
    {
      id: 101,
      customer_name: 'Alice',
      order_id: 101,
      requested_quantity: 25,
      allocated_quantity: 0,
      status: 'deferred',
      minimum_acceptable_quantity: 15,
      partial_delivery_allowed: true,
    },
    {
      id: 102,
      customer_name: 'Bob',
      order_id: 102,
      requested_quantity: 20,
      allocated_quantity: 0,
      status: 'deferred',
      minimum_acceptable_quantity: 20,
      partial_delivery_allowed: false,
    },
  ]);

  useEffect(() => {
    let isMounted = true;
    const fetchAllocationData = async () => {
      try {
        const prodRes = await apiClient.get('/products').catch(() => null);
        const prodList = prodRes?.data || prodRes || [];
        if (Array.isArray(prodList) && prodList.length > 0) {
          const target = prodList.find((p) => p.sku === 'GAUGE-P300') || prodList[0];
          if (target && isMounted) {
            setProductHeader({
              name: target.name || 'Pressure Gauge Pro',
              sku: target.sku || 'GAUGE-P300',
              onHand: target.on_hand_quantity ?? target.stock ?? 40,
            });
          }
        }

        const runsRes = await apiClient.get('/allocation/runs').catch(() => null);
        const runs = runsRes?.data?.runs || runsRes?.data || runsRes || [];
        if (Array.isArray(runs) && runs.length > 0) {
          const latestRun = runs[0];
          const runDetails = await apiClient.get(`/allocation/runs/${latestRun.id}`).catch(() => null);
          const results = runDetails?.data?.results || runDetails?.results || [];
          if (Array.isArray(results) && results.length > 0 && isMounted) {
            const matched = results.filter((r) => r.product_sku === 'GAUGE-P300' || r.sku === 'GAUGE-P300');
            const itemsToUse = matched.length > 0 ? matched : results.slice(0, 3);
            setQueueOrders(
              itemsToUse.map((r, idx) => ({
                id: r.order_item_id || r.id || idx + 1,
                customer_name: r.customer_name || `Customer #${r.customer_id || r.order_id || idx + 1}`,
                order_id: r.order_id || r.id || idx + 1,
                requested_quantity: Number(r.requested_quantity || 0),
                allocated_quantity: Number(r.allocated_quantity || 0),
                status: r.status,
                minimum_acceptable_quantity: Number(r.minimum_acceptable_quantity || 0),
                partial_delivery_allowed: Boolean(r.partial_delivery_allowed),
              }))
            );
          }
        }
      } catch {
        // Fallback
      }
    };
    fetchAllocationData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg text-t font-sans flex flex-col selection:bg-ac selection:text-white relative overflow-x-hidden">
      {/* Soft red ambient lighting effect from reference video */}
      <AmbientLighting />

      {/* Top Landing Navigation Bar */}
      <PublicNavbar active="home" />

      {/* Main Content Container: max-width 1120px matching reference specs */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-6 space-y-16 flex-1 w-full relative z-10">
        {/* 1. Landing Hero: 2 columns (1.15fr / 1fr), gap 56px */}
        <section className="relative pt-6 sm:pt-10">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-14 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="space-y-6">
              {/* Badge: Red pill matching reference image */}
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[12px] font-medium text-white bg-ac px-3.5 py-1.5 rounded-pill shadow-xs inline-block">
                  VORTEXA 3.0 • Problem Statement S-03
                </span>
              </div>

              {/* Product Hero Heading matching reference */}
              <h1 className="font-display text-[44px] sm:text-[60px] font-bold leading-[1.04] tracking-[-0.03em] text-t">
                Deterministic order allocation <span className="text-ac">and supply intelligence</span>
              </h1>

              {/* Supporting description */}
              <p className="text-[17px] sm:text-[18px] leading-[1.6] text-t2 font-normal max-w-[520px]">
                OrderWise resolves inventory conflicts across competing customer orders using deterministic priority rules, Groq Llama-3 recommendations with strict human governance, and real-time allocation explanations.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {user ? (
                  <Link
                    to={user.role === 'customer' ? '/dashboard' : '/admin'}
                    className="btn-primary space-x-2 shadow-[0_6px_24px_rgba(229,9,20,0.4)]"
                  >
                    <span>Enter {user.role === 'customer' ? 'Customer portal' : 'Admin console'} &rarr;</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn-primary space-x-2 shadow-[0_6px_24px_rgba(229,9,20,0.4)]"
                    >
                      <span>Launch Operations Portal &rarr;</span>
                    </Link>
                    <Link
                      to="/register"
                      className="btn-secondary"
                    >
                      <span>Create customer account</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Hero Visual Switcher */}
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="w-full flex items-center justify-between">
                <div
                  className="flex items-center space-x-1 p-1 bg-s rounded-pill border border-[#2A2A2A] text-xs"
                  role="tablist"
                  aria-label="Hero visual display options"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={heroRightTab === 'queue'}
                    onClick={() => setHeroRightTab('queue')}
                    className={`px-3.5 py-1.5 rounded-pill font-sans text-[12px] font-medium transition-colors ${
                      heroRightTab === 'queue'
                        ? 'bg-ac text-white font-semibold shadow-xs'
                        : 'text-t2 hover:text-t'
                    }`}
                  >
                    Live Allocation Queue
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={heroRightTab === '3d'}
                    onClick={() => setHeroRightTab('3d')}
                    className={`px-3.5 py-1.5 rounded-pill font-sans text-[12px] font-medium transition-colors ${
                      heroRightTab === '3d'
                        ? 'bg-ac text-white font-semibold shadow-xs'
                        : 'text-t2 hover:text-t'
                    }`}
                  >
                    3D Warehouse Facility
                  </button>
                </div>
                <span className="text-[12px] font-sans text-t2 hidden sm:inline">
                  {heroRightTab === 'queue' ? '40 on hand' : 'Interactive Axonometric'}
                </span>
              </div>

              {heroRightTab === '3d' ? (
                <div className="w-full max-w-[580px]">
                  <IsometricWarehouseVisual />
                </div>
              ) : (
                <div className="card-base w-full p-7 bg-s/95 backdrop-blur-sm space-y-4 border-[#2A2A2A]">
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#2A2A2A]">
                    <div>
                      <span className="text-[12px] font-mono text-t2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-ac shadow-[0_0_10px_#E50914] inline-block mr-2 animate-pulse" />
                        Live allocation queue
                      </span>
                      <h3 className="text-[20px] font-display font-bold text-t mt-1">
                        {productHeader.name} ({productHeader.sku})
                      </h3>
                    </div>
                    <span className="text-[12px] font-mono text-t2 font-medium">{productHeader.onHand} on hand</span>
                  </div>

                  {/* Dynamic Allocation Queue Progress Bars */}
                  {queueOrders.map((item) => {
                    const requested = Number(item.requested_quantity || 0);
                    const allocated = Number(item.allocated_quantity || 0);
                    const progress = requested > 0 ? Math.min(100, Math.max(0, (allocated / requested) * 100)) : 0;

                    let fillColor = '#FF7A7A'; // Deferred
                    let statusLabel = 'Deferred';
                    let textColor = 'text-[#FF7A7A]';

                    if (item.status === 'fulfilled' || (requested > 0 && allocated >= requested)) {
                      fillColor = '#4ADE80';
                      statusLabel = 'Fulfilled';
                      textColor = 'text-[#4ADE80]';
                    } else if (item.status === 'partially_fulfilled' || (allocated > 0 && allocated < requested)) {
                      fillColor = '#F5B544';
                      statusLabel = 'Partial';
                      textColor = 'text-[#F5B544]';
                    }

                    let subClause = '';
                    if (statusLabel === 'Deferred') {
                      if (!item.partial_delivery_allowed) {
                        subClause = ' (no partial)';
                      } else if (item.minimum_acceptable_quantity) {
                        subClause = ` (min ${item.minimum_acceptable_quantity})`;
                      }
                    }

                    return (
                      <div key={`queue-order-${item.id || item.order_id}`} className="py-2 space-y-2">
                        <div className="flex items-center justify-between text-[14px]">
                          <span className="font-semibold text-t truncate pr-2">
                            {item.customer_name} · Order #{item.order_id}
                          </span>
                          <span className={`text-[12px] font-mono font-medium ${textColor} shrink-0`}>
                            {statusLabel} {allocated}/{requested}{subClause}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#252525] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: fillColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-3 border-t border-[#2A2A2A] text-[12px] font-mono text-t2">
                    <span>Deterministic resolution</span>
                    <span>Zero over-allocation</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. Capability / Fill Rate KPI Strip */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-base p-6 flex flex-col justify-between">
              <span className="text-[13px] font-sans font-medium text-t2">Overall fill rate</span>
              <div className="text-[40px] font-display font-bold text-t tracking-tight my-1.5">94.2%</div>
              <span className="text-[13px] font-sans text-t2/80">Target: ≥90% deterministic fulfillment</span>
            </div>

            <div className="card-base p-6 flex flex-col justify-between">
              <span className="text-[13px] font-sans font-medium text-t2">Active catalog items</span>
              <div className="text-[40px] font-display font-bold text-t tracking-tight my-1.5">4 items</div>
              <span className="text-[13px] font-sans text-t2/80">Pumps, valves, gauges &amp; control units</span>
            </div>

            <div className="card-base p-6 flex flex-col justify-between border-ac/70 shadow-[inset_0_0_40px_rgba(229,9,20,0.10)]">
              <span className="text-[13px] font-sans font-medium text-t2">Unresolved alerts</span>
              <div className="text-[40px] font-display font-bold text-t tracking-tight my-1.5">1 critical</div>
              <span className="text-[13px] font-sans text-t2/80">GAUGE-P300 stock below reorder point</span>
            </div>
          </div>
        </section>

        {/* 3. How OrderWise Works: Matching reference image */}
        <section id="how-it-works" className="space-y-6">
          <div>
            <h2 className="text-[34px] font-display font-bold tracking-tight text-t">
              How OrderWise works
            </h2>
            <div className="w-10 h-[3px] bg-ac mt-2.5 mb-3 rounded-full" />
            <p className="text-[15px] text-t2 font-sans">
              Deterministic priority scheduling governed by authorized supply chain operators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-base p-7 space-y-3">
              <h3 className="text-[20px] font-display font-bold text-t">
                Deterministic allocation
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Multi-tier priority order ensures zero double-counting across competing customer demands.
              </p>
            </div>

            <div className="card-base p-7 space-y-3">
              <h3 className="text-[20px] font-display font-bold text-t">
                AI recommends, humans approve
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Llama-3 analyzes context with confidence scores; inventory modifies only with admin approval.
              </p>
            </div>

            <div className="card-base p-7 space-y-3">
              <h3 className="text-[20px] font-display font-bold text-t">
                Live real-time stream
              </h3>
              <p className="text-[15px] leading-relaxed text-t2">
                Server-Sent Events broadcast instant allocations scoped strictly to customer permissions.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Enterprise Allocation Modules: 4 columns matching reference */}
        <section id="modules" className="space-y-6">
          <div>
            <h2 className="text-[34px] font-display font-bold tracking-tight text-t">
              Enterprise allocation modules
            </h2>
            <div className="w-10 h-[3px] bg-ac mt-2.5 mb-3 rounded-full" />
            <p className="text-[15px] text-t2 font-sans">
              Fully integrated tools for inventory planning, scenario testing, and compliance.
            </p>
          </div>

          {/* Module cards: 4 columns matching reference image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/allocation"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[12px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[18px] font-display font-bold text-t group-hover:text-t transition-colors">
                    Allocation Center
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[14px] text-t2 leading-normal mt-2">
                  Run deterministic allocation with step-by-step explanations.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/simulations"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[12px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[18px] font-display font-bold text-t group-hover:text-t transition-colors">
                    Simulation Lab
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[14px] text-t2 leading-normal mt-2">
                  Zero-mutation sandbox testing stock surges and supply delays.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/reports"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[12px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[18px] font-display font-bold text-t group-hover:text-t transition-colors">
                    Reports &amp; CSV exports
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[14px] text-t2 leading-normal mt-2">
                  Track fill rates and export 1-click supply chain audits.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/audit"
              className="card-base p-6 hover:border-ac/50 hover:bg-s2/30 transition-all group flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[12px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[18px] font-display font-bold text-t group-hover:text-t transition-colors">
                    Audit log viewer
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-ac group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[14px] text-t2 leading-normal mt-2">
                  Immutable governance logs tracking approvals and changes.
                </p>
              </div>
            </Link>
          </div>

          {/* Roadmap card matching Image 3 */}
          <div className="card-roadmap p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[12px] font-mono text-t2 block">ROADMAP · Next major release</span>
              <h3 className="text-[19px] font-display font-bold text-t">
                Multi-warehouse cross-docking &amp; vendor automated PO dispatch
              </h3>
              <p className="text-[14px] text-t2 leading-normal">
                Automated supplier reorder purchase orders, supplier delay tracking, and real-time cold chain telemetry.
              </p>
            </div>
            <span className="text-[12px] font-mono text-t2 shrink-0">Q2 Delivery</span>
          </div>
        </section>

        {/* 5. Callout Banner */}
        <section className="card-base p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-ac/40">
          <div className="space-y-2 max-w-xl">
            <span className="text-[12px] font-mono text-t2 block">Instant demo access</span>
            <h2 className="text-[28px] sm:text-[32px] font-display font-bold text-t">
              Ready to explore OrderWise live?
            </h2>
            <div className="w-10 h-[3px] bg-ac rounded-full mt-2 mb-3" />
            <p className="text-[15px] text-t2 pt-1 leading-relaxed">
              Sign in with 1-click pre-configured demo accounts for Administrators, Inventory Managers, or Customers.
            </p>
          </div>

          <Link
            to="/login"
            className="btn-primary min-h-[46px] px-7 text-[14px] shadow-[0_6px_24px_rgba(229,9,20,0.4)] shrink-0"
          >
            <span>Go to 1-Click Login &rarr;</span>
          </Link>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-bd bg-s py-10 px-4 sm:px-8 mt-16 text-[13px] text-t2 relative z-10">
        <div className="max-w-container mx-auto flex flex-col sm:flex-row items-center justify-between text-[12px] font-mono text-t2 gap-4">
          <span>OrderWise &mdash; Deterministic inventory allocation and supply intelligence</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
