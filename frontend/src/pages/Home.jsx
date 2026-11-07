import React, { useState, useEffect } from 'react';
import PublicNavbar from '../components/layout/PublicNavbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight, Inbox, Sparkles, Cpu, RefreshCw, CheckCircle2 } from 'lucide-react';
import IsometricWarehouseVisual from '../components/3d/IsometricWarehouseVisual';
import AmbientLighting from '../components/ui/AmbientLighting';
import AnimatedRedWaves from '../components/ui/AnimatedRedWaves';
import { useTranslation } from '../contexts/I18nContext';
import apiClient from '../api/client';

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [heroRightTab, setHeroRightTab] = useState('3d');
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
      {/* Soft red ambient lighting effect */}
      <AmbientLighting withWaves={false} />

      {/* Top Landing Navigation Bar */}
      <PublicNavbar active="home" />

      {/* Main Content Container: max-width 1200px */}
      <main className="max-w-container mx-auto px-4 sm:px-8 py-6 space-y-16 flex-1 w-full relative z-10">
        {/* 1. Landing Hero: 2 columns (1.15fr / 1fr), gap 56px */}
        <section className="relative pt-6 sm:pt-10 pb-6 overflow-visible">
          {/* Signature Animated Flowing Red Wave Ribbon - Top-Right corner behind warehouse & HUD */}
          <AnimatedRedWaves variant="corner" className="z-0" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-14 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="space-y-6">
              {/* Product Hero Heading */}
              <h1 className="font-display text-[44px] sm:text-[58px] font-bold leading-[1.08] tracking-[-0.03em] text-t">
                {t('home.hero_title_1')}<br />
                {t('home.hero_title_2')} <span className="text-ac">{t('home.hero_title_3')}</span>
              </h1>

              {/* Supporting description */}
              <p className="text-[16px] sm:text-[18px] leading-[1.6] text-t2 font-normal max-w-[540px]">
                {t('home.hero_desc')}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {user ? (
                  <Link
                    to={user.role === 'customer' ? '/dashboard' : '/admin'}
                    className="btn-primary space-x-2"
                  >
                    <span>{user.role === 'customer' ? t('nav.customer_portal') : t('nav.operations_portal')} &rarr;</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn-primary space-x-2"
                    >
                      <span>{t('home.get_started')} &rarr;</span>
                      <span className="sr-only">Launch Operations</span>
                    </Link>
                    <a
                      href="#workflow"
                      className="btn-secondary space-x-2 inline-flex items-center"
                    >
                      <span>{t('home.watch_demo')}</span>
                      <span className="text-[11px]">▶</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Hero Visual Switcher (3D Warehouse + Live Allocation Queue) */}
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="w-full flex items-center justify-between">
                <div
                  className="flex items-center space-x-1 p-1 bg-s rounded-[8px] border border-bd text-xs"
                  role="tablist"
                  aria-label="Hero visual display options"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={heroRightTab === 'queue'}
                    onClick={() => setHeroRightTab('queue')}
                    className={`px-3 py-1.5 rounded-[6px] font-sans text-[12px] font-medium transition-colors ${
                      heroRightTab === 'queue'
                        ? 'bg-ac text-white font-semibold'
                        : 'text-t2 hover:text-t'
                    }`}
                  >
                    {t('home.live_queue')}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={heroRightTab === '3d'}
                    onClick={() => setHeroRightTab('3d')}
                    className={`px-3 py-1.5 rounded-[6px] font-sans text-[12px] font-medium transition-colors ${
                      heroRightTab === '3d'
                        ? 'bg-ac text-white font-semibold'
                        : 'text-t2 hover:text-t'
                    }`}
                  >
                    {t('home.warehouse_3d')}
                  </button>
                </div>
                <span className="text-[12px] font-mono text-t2 hidden sm:inline">
                  {heroRightTab === 'queue' ? `${productHeader.onHand} on hand` : 'Interactive Axonometric'}
                </span>
              </div>

              {heroRightTab === '3d' ? (
                <div className="w-full max-w-[580px]">
                  <IsometricWarehouseVisual />
                </div>
              ) : (
                <div className="card-base w-full p-6 bg-s/95 backdrop-blur-sm space-y-4 border-bd">
                  <div className="flex items-center justify-between pb-3.5 border-b border-bd">
                    <div>
                      <span className="text-[12px] font-mono text-t2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-ac inline-block mr-2" />
                        Live allocation queue
                      </span>
                      <h3 className="text-[19px] font-display font-bold text-t mt-1">
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
                    let textColor = 'text-no';

                    if (item.status === 'fulfilled' || (requested > 0 && allocated >= requested)) {
                      fillColor = '#4ADE80';
                      statusLabel = 'Fulfilled';
                      textColor = 'text-ok';
                    } else if (item.status === 'partially_fulfilled' || (allocated > 0 && allocated < requested)) {
                      fillColor = '#F5B544';
                      statusLabel = 'Partial';
                      textColor = 'text-wa';
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
                          <span className="font-medium text-t truncate pr-2">
                            {item.customer_name} · Order #{item.order_id}
                          </span>
                          <span className={`text-[12px] font-mono font-medium ${textColor} shrink-0`}>
                            {statusLabel} {allocated}/{requested}{subClause}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-s2 rounded-[4px] overflow-hidden border border-bd/40">
                          <div
                            className="h-full rounded-[4px] transition-all duration-500 ease-out"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: fillColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-3 border-t border-bd text-[12px] font-mono text-t2">
                    <span>Deterministic resolution</span>
                    <span>Zero over-allocation</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performance & Capability Feature Bar from Reference */}
          <div className="relative z-10 pt-8 mt-8 border-t border-bd/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px] text-t2 font-medium">
            <div className="flex items-center space-x-2">
              <span className="text-ac font-bold">⚡</span>
              <span>{t('home.procurement_strip_1')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-ac font-bold">✦</span>
              <span>{t('home.procurement_strip_2')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-ac font-bold">💧</span>
              <span>{t('home.procurement_strip_3')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-ac font-bold">✦</span>
              <span>{t('home.procurement_strip_4')}</span>
            </div>
          </div>
        </section>

        {/* 2. Capability / Operational KPI Strip */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-base p-6 flex flex-col justify-between">
              <span className="text-[13px] font-sans font-medium text-t2">{t('home.kpi_fill_rate')}</span>
              <div className="text-[38px] font-display font-bold text-t tracking-tight my-1.5">94.2%</div>
              <span className="text-[12px] font-mono text-t2">Target: ≥90% deterministic fulfillment</span>
            </div>

            <div className="card-base p-6 flex flex-col justify-between">
              <span className="text-[13px] font-sans font-medium text-t2">{t('home.kpi_catalog_items')}</span>
              <div className="text-[38px] font-display font-bold text-t tracking-tight my-1.5">15 items</div>
              <span className="text-[12px] font-mono text-t2">Industrial components &amp; sensors</span>
            </div>

            <div className="card-base p-6 flex flex-col justify-between border-ac/40 bg-alert-bg/50">
              <span className="text-[13px] font-sans font-medium text-t2">{t('home.kpi_unresolved_alerts')}</span>
              <div className="text-[38px] font-display font-bold text-t tracking-tight my-1.5">1 critical</div>
              <span className="text-[12px] font-mono text-t2">GAUGE-P300 stock below reorder point</span>
            </div>
          </div>
        </section>

        {/* 3. Connected Four-Step Operational Workflow matching Section 4 */}
        <section id="workflow" className="space-y-6 scroll-mt-24">
          <div>
            <span className="font-mono text-[11px] font-semibold text-t2 tracking-wider uppercase block mb-1">
              OPERATIONAL ARCHITECTURE
            </span>
            <h2 className="text-[30px] sm:text-[34px] font-display font-bold tracking-tight text-t">
              End-to-End Allocation Workflow
            </h2>
            <p className="text-[15px] text-t2 font-sans mt-1">
              Connected deterministic priority scheduling, human governance, and explainable inventory distribution.
            </p>
          </div>

          {/* Desktop Connected Horizontal Flow / Mobile Vertical Sequence */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="card-base p-6 flex flex-col justify-between space-y-4 relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] font-semibold text-ac px-2 py-0.5 rounded-[4px] bg-ac/10 border border-ac/20">
                    STEP 01
                  </span>
                  <Inbox className="h-4 w-4 text-t2" />
                </div>
                <h3 className="text-[17px] font-display font-bold text-t">
                  Order Ingestion
                </h3>
                <p className="text-[13.5px] leading-relaxed text-t2">
                  Capture incoming purchase orders with requested quantities, partial delivery flags, and minimum threshold constraints.
                </p>
              </div>
              <div className="pt-2 border-t border-bd text-[11px] font-mono text-t2 flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
                <span>Multi-item line support</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card-base p-6 flex flex-col justify-between space-y-4 relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] font-semibold text-ac px-2 py-0.5 rounded-[4px] bg-ac/10 border border-ac/20">
                    STEP 02
                  </span>
                  <Sparkles className="h-4 w-4 text-t2" />
                </div>
                <h3 className="text-[17px] font-display font-bold text-t">
                  Priority Assessment
                </h3>
                <p className="text-[13.5px] leading-relaxed text-t2">
                  Evaluate client commitments and business urgency notes to recommend priority tiers (Critical to Low) with human governance.
                </p>
              </div>
              <div className="pt-2 border-t border-bd text-[11px] font-mono text-t2 flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
                <span>Human-in-the-loop audit</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card-base p-6 flex flex-col justify-between space-y-4 relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] font-semibold text-ac px-2 py-0.5 rounded-[4px] bg-ac/10 border border-ac/20">
                    STEP 03
                  </span>
                  <Cpu className="h-4 w-4 text-t2" />
                </div>
                <h3 className="text-[17px] font-display font-bold text-t">
                  Deterministic Allocation
                </h3>
                <p className="text-[13.5px] leading-relaxed text-t2">
                  Execute multi-key priority resolution by approved tier, promised date, and order age with strict zero over-allocation guarantees.
                </p>
              </div>
              <div className="pt-2 border-t border-bd text-[11px] font-mono text-t2 flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
                <span>Deterministic reproducibility</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="card-base p-6 flex flex-col justify-between space-y-4 relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] font-semibold text-ac px-2 py-0.5 rounded-[4px] bg-ac/10 border border-ac/20">
                    STEP 04
                  </span>
                  <RefreshCw className="h-4 w-4 text-t2" />
                </div>
                <h3 className="text-[17px] font-display font-bold text-t">
                  Review &amp; Replenishment
                </h3>
                <p className="text-[13.5px] leading-relaxed text-t2">
                  Inspect item-level before-and-after run diffs, monitor shortage alerts, and calculate reorder point replenishment schedules.
                </p>
              </div>
              <div className="pt-2 border-t border-bd text-[11px] font-mono text-t2 flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
                <span>Full explanation trail</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Enterprise Allocation Modules: 4 columns */}
        <section id="modules" className="space-y-6">
          <div>
            <span className="font-mono text-[11px] font-semibold text-t2 tracking-wider uppercase block mb-1">
              PLATFORM CAPABILITIES
            </span>
            <h2 className="text-[30px] sm:text-[34px] font-display font-bold tracking-tight text-t">
              Enterprise Operations Modules
            </h2>
            <p className="text-[15px] text-t2 font-sans mt-1">
              Fully integrated tools for inventory planning, scenario testing, and supply intelligence.
            </p>
          </div>

          {/* Module cards: 4 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/allocation"
              className="card-base p-6 hover:border-[#383838] transition-all group flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-[11px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[17px] font-display font-bold text-t">
                    Allocation Center
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-t group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[13.5px] text-t2 leading-normal mt-2">
                  Run deterministic allocation with step-by-step explanations.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/simulations"
              className="card-base p-6 hover:border-[#383838] transition-all group flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-[11px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[17px] font-display font-bold text-t">
                    Simulation Lab
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-t group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[13.5px] text-t2 leading-normal mt-2">
                  Zero-mutation sandbox testing stock surges and supply delays.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/reports"
              className="card-base p-6 hover:border-[#383838] transition-all group flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-[11px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[17px] font-display font-bold text-t">
                    Reports &amp; CSV exports
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-t group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[13.5px] text-t2 leading-normal mt-2">
                  Track fill rates and export 1-click supply chain audits.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/audit"
              className="card-base p-6 hover:border-[#383838] transition-all group flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-[11px] font-mono text-ok font-medium block mb-2">● Active</span>
                <div className="flex items-start justify-between">
                  <h4 className="text-[17px] font-display font-bold text-t">
                    Audit log viewer
                  </h4>
                  <ArrowRight className="h-4 w-4 text-t2 group-hover:text-t group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-[13.5px] text-t2 leading-normal mt-2">
                  Immutable governance logs tracking approvals and changes.
                </p>
              </div>
            </Link>
          </div>

          {/* Operational Roadmap Banner */}
          <div className="card-roadmap p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-t2 block">ROADMAP · Operational capability</span>
              <h3 className="text-[17px] font-display font-bold text-t">
                Multi-warehouse cross-docking &amp; vendor automated PO dispatch
              </h3>
              <p className="text-[13.5px] text-t2 leading-normal">
                Automated supplier reorder purchase orders, supplier delay tracking, and real-time cold chain telemetry.
              </p>
            </div>
            <span className="text-[11px] font-mono text-t2 shrink-0">Planned Delivery</span>
          </div>
        </section>

        {/* 5. Callout Banner: Launch Operations with Signature Bottom-Left Flowing Red Wave */}
        <section className="relative overflow-hidden rounded-card">
          {/* Signature Animated Flowing Red Wave Ribbon - Bottom-Left corner curving behind Callout Banner as shown in design reference */}
          <AnimatedRedWaves variant="bottom-left" className="z-0" />

          <div className="card-base p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-bd bg-s/90 backdrop-blur-sm relative z-10">
            <div className="space-y-2 max-w-xl">
              <span className="text-[11px] font-mono text-t2 block uppercase tracking-wider">Operational Access</span>
              <h2 className="text-[26px] sm:text-[30px] font-display font-bold text-t">
                {t('home.ready_explore') || 'Ready to explore OrderWise operations?'}
              </h2>
              <p className="text-[14.5px] text-t2 pt-1 leading-relaxed">
                {t('home.ready_explore_desc') || 'Sign in with pre-configured operational roles for Administrators, Inventory Managers, or Customers.'}
              </p>
            </div>

            <Link
              to="/login"
              className="btn-primary min-h-[42px] px-6 text-[14px] shrink-0"
            >
              <span>{t('home.launch_ops') || 'Launch Operations'} &rarr;</span>
            </Link>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-bd bg-s/85 backdrop-blur-sm py-8 px-4 sm:px-8 mt-16 text-[13px] text-t2 relative z-10">
        <div className="max-w-container mx-auto flex flex-col sm:flex-row items-center justify-between text-[12px] font-mono text-t2 gap-4">
          <span>OrderWise &mdash; Deterministic inventory allocation and supply intelligence</span>
          <span>All rights reserved &bull; Enterprise Operations</span>
        </div>
      </footer>
    </div>
  );
}
