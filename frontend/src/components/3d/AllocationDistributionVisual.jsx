import React, { useState, useMemo } from 'react';
import StatusPill from '../ui/StatusPill';
import Badge from '../ui/Badge';
import { Layers, Box, Info } from 'lucide-react';

/**
 * AllocationDistributionVisual - Scene 2: Allocation Center
 *
 * Built directly from the exact reference geometry in `docs/reference/orderwise-3d-allocation.svg`.
 * Exact axonometric 30-degree isometric projection:
 * - Grey stock pile (wireframe initial stock + solid remaining stock box)
 * - Solid allocated box (Green #6ee7a0/#2f9e60/#1f6e42 for fulfilled, Amber for partial)
 * - Dashed pink-red wireframe outlines (#FF7A7A) for unmet/deferred demand
 * - OrderWise red supply route line (#E50914)
 * - 100% REAL API DATA: Customer names, requested quantities, allocated quantities, and remaining stock.
 *   Zero hardcoded mock numbers.
 */
export default function AllocationDistributionVisual({
  results = [],
  products = [],
  selectedRun = null,
}) {
  const [selectedProductId, setSelectedProductId] = useState('all');

  // Discover distinct products present in the active allocation run
  const availableProducts = useMemo(() => {
    const map = new Map();
    results.forEach((r) => {
      if (r.product_id && !map.has(r.product_id)) {
        map.set(r.product_id, r.product_name || `Product #${r.product_id}`);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [results]);

  // Set default product if 'all' is selected and products are available
  const activeProductId = useMemo(() => {
    if (selectedProductId !== 'all') return selectedProductId;
    return availableProducts[0]?.id || 'all';
  }, [selectedProductId, availableProducts]);

  // Filter run results for the targeted product SKU
  const productResults = useMemo(() => {
    if (activeProductId === 'all') return results;
    return results.filter((r) => String(r.product_id) === String(activeProductId));
  }, [results, activeProductId]);

  // Categorize actual orders: fulfilled/partial vs deferred
  const { allocatedOrders, deferredOrders, metrics } = useMemo(() => {
    const allocated = [];
    const deferred = [];
    let totalReq = 0;
    let totalAlloc = 0;

    productResults.forEach((r) => {
      const req = Number(r.requested_quantity || 0);
      const alloc = Number(r.allocated_quantity || 0);
      totalReq += req;
      totalAlloc += alloc;

      if (alloc > 0) {
        allocated.push(r);
      } else {
        deferred.push(r);
      }
    });

    // Match inventory stock from products catalog if available
    const productRecord = products.find((p) => String(p.id) === String(activeProductId));
    const onHand = productRecord?.on_hand_quantity !== undefined
      ? Number(productRecord.on_hand_quantity)
      : Math.max(totalReq, totalAlloc);
    const remaining = Math.max(0, onHand - totalAlloc);

    return {
      allocatedOrders: allocated,
      deferredOrders: deferred,
      metrics: {
        totalRequested: totalReq,
        totalAllocated: totalAlloc,
        initialStock: onHand,
        remainingStock: remaining,
        fulfilledCount: allocated.filter((a) => a.status === 'fulfilled').length,
        partialCount: allocated.filter((a) => a.status === 'partially_fulfilled').length,
        deferredCount: deferred.length,
      },
    };
  }, [productResults, products, activeProductId]);

  if (!results || results.length === 0) {
    return (
      <div className="p-8 text-center text-[#A8A8A8] bg-[#161616] rounded-[14px] border border-[#2A2A2A]">
        <Box className="h-8 w-8 text-[#A8A8A8]/40 mx-auto mb-2" />
        <p className="font-mono text-[13px]">No allocation decisions to visualize for this run.</p>
        <p className="text-[12px] text-[#A8A8A8]/70 mt-1">Execute an allocation run to inspect 3D distribution geometry.</p>
      </div>
    );
  }

  // Primary Allocated Order (Charlie in reference SVG example)
  const primaryAllocated = allocatedOrders[0] || null;
  const isFulfilled = primaryAllocated?.status === 'fulfilled';

  // Deferred Orders (Alice & Bob in reference SVG example)
  const deferred1 = deferredOrders[0] || null;
  const deferred2 = deferredOrders[1] || null;

  return (
    <div className="space-y-4">
      {/* Top Controls Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#161616] rounded-[14px] border border-[#2A2A2A]">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-[#E50914]" />
          <span className="text-[13px] font-mono text-white font-medium">
            3D Allocation Distribution &bull; Real-time Decisions
          </span>
          {selectedRun?.id && (
            <span className="text-[11px] font-mono text-[#A8A8A8] bg-[#232323] px-2 py-0.5 rounded-full border border-[#2A2A2A]">
              Run #{selectedRun.id}
            </span>
          )}
        </div>

        {/* Target SKU Selector */}
        {availableProducts.length > 1 && (
          <div className="flex items-center space-x-2">
            <label htmlFor="refSkuSelect" className="text-[12px] font-mono text-[#A8A8A8]">
              Target SKU:
            </label>
            <select
              id="refSkuSelect"
              value={activeProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-[#232323] border border-[#2A2A2A] rounded-full px-3 py-1 text-[12px] font-mono text-white focus:outline-none focus:border-[#E50914]"
            >
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Real Allocation Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
        <div className="p-3 bg-[#161616] rounded-[10px] border border-[#2A2A2A]">
          <span className="text-[11px] text-[#A8A8A8] block">Initial Stock</span>
          <span className="text-[20px] font-bold text-white">{metrics.initialStock}</span>
          <span className="text-[10px] text-[#A8A8A8] block">units available</span>
        </div>
        <div className="p-3 bg-[#161616] rounded-[10px] border border-[#2A2A2A]">
          <span className="text-[11px] text-[#E50914] block">Allocated Stock</span>
          <span className="text-[20px] font-bold text-[#E50914]">{metrics.totalAllocated}</span>
          <span className="text-[10px] text-[#A8A8A8] block">units committed</span>
        </div>
        <div className="p-3 bg-[#161616] rounded-[10px] border border-[#2A2A2A]">
          <span className="text-[11px] text-[#4ADE80] block">Remaining Stock</span>
          <span className="text-[20px] font-bold text-[#4ADE80]">{metrics.remainingStock}</span>
          <span className="text-[10px] text-[#A8A8A8] block">units left</span>
        </div>
        <div className="p-3 bg-[#161616] rounded-[10px] border border-[#2A2A2A]">
          <span className="text-[11px] text-[#FF7A7A] block">Deferred Demand</span>
          <span className="text-[20px] font-bold text-[#FF7A7A]">{metrics.deferredCount}</span>
          <span className="text-[10px] text-[#A8A8A8] block">unmet orders</span>
        </div>
      </div>

      {/* Screen Reader Semantic Narrative */}
      <div className="sr-only" aria-live="polite">
        Stock allocation breakdown: {metrics.totalAllocated} units allocated out of {metrics.initialStock}.
        {primaryAllocated ? `${primaryAllocated.customer_name} allocated ${primaryAllocated.allocated_quantity} of ${primaryAllocated.requested_quantity}.` : 'No allocations made.'}
        {deferred1 ? `${deferred1.customer_name} deferred with 0 of ${deferred1.requested_quantity}.` : ''}
        {deferred2 ? `${deferred2.customer_name} deferred with 0 of ${deferred2.requested_quantity}.` : ''}
        Remaining stock: {metrics.remainingStock} units.
      </div>

      {/* Main Exact SVG Isometric Scene Canvas */}
      <div className="relative bg-[#161616] rounded-[14px] border border-[#2A2A2A] p-2 sm:p-6 overflow-hidden">
        {/* Soft Red Radial Lighting in background */}
        <div
          className="absolute -top-12 -right-12 w-[350px] h-[250px] pointer-events-none rounded-full blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(229, 9, 20, 0.14), transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full aspect-[643/600] min-h-[340px] flex items-center justify-center">
          <svg
            viewBox="-252 -270 643 600"
            className="w-full h-full overflow-visible select-none"
            role="img"
            aria-label={`Stock of ${metrics.initialStock} split between competing orders`}
          >
            {/* Ground Platform Slab matching orderwise-3d-allocation.svg */}
            <g>
              <polygon
                points="-242.5,100.0 138.6,320.0 138.6,320.0 -242.5,100.0"
                fill="#111"
                stroke="#3a3a3a"
                strokeWidth=".8"
                strokeLinejoin="round"
              />
              <polygon
                points="381.1,180.0 138.6,320.0 138.6,320.0 381.1,180.0"
                fill="#0c0c0c"
                stroke="#3a3a3a"
                strokeWidth=".8"
                strokeLinejoin="round"
              />
              <polygon
                points="0.0,-40.0 381.1,180.0 138.6,320.0 -242.5,100.0"
                fill="#1d1d1d"
                stroke="#3a3a3a"
                strokeWidth=".8"
                strokeLinejoin="round"
              />
            </g>

            {/* Wireframe Initial Stock Volume (Dashed Outline) */}
            <polygon
              points="-103.9,-112.0 0.0,-52.0 103.9,-112.0 0.0,-172.0"
              fill="none"
              stroke="#8a8a8a"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <line x1="-103.9" y1="48.0" x2="-103.9" y2="-112.0" stroke="#8a8a8a" strokeWidth="1.2" strokeDasharray="4 3" />
            <line x1="0.0" y1="108.0" x2="0.0" y2="-52.0" stroke="#8a8a8a" strokeWidth="1.2" strokeDasharray="4 3" />
            <line x1="103.9" y1="48.0" x2="103.9" y2="-112.0" stroke="#8a8a8a" strokeWidth="1.2" strokeDasharray="4 3" />

            {/* Remaining Stock Solid Box */}
            <g>
              <polygon
                points="-103.9,48.0 0.0,108.0 0.0,68.0 -103.9,8.0"
                fill="#1b1b1b"
                stroke="#3a3a3a"
                strokeWidth=".8"
                strokeLinejoin="round"
              />
              <polygon
                points="103.9,48.0 0.0,108.0 0.0,68.0 103.9,8.0"
                fill="#121212"
                stroke="#3a3a3a"
                strokeWidth=".8"
                strokeLinejoin="round"
              />
              <polygon
                points="0.0,-52.0 103.9,8.0 0.0,68.0 -103.9,8.0"
                fill="#2c2c2c"
                stroke="#3a3a3a"
                strokeWidth=".8"
                strokeLinejoin="round"
              />
            </g>

            {/* Red Dashed Allocation Supply Route */}
            <polyline
              points="52.0,78.0 121.2,118.0"
              stroke="#E50914"
              strokeWidth="1.6"
              strokeDasharray="5 4"
              fill="none"
            />

            {/* Solid Allocated Box (Fulfilled or Partial) */}
            {primaryAllocated ? (
              <g>
                <polygon
                  points="159.3,120.0 214.8,152.0 214.8,32.0 159.3,-0.0"
                  fill={isFulfilled ? '#2f9e60' : '#b45309'}
                  stroke="#3a3a3a"
                  strokeWidth=".8"
                  strokeLinejoin="round"
                />
                <polygon
                  points="270.2,120.0 214.8,152.0 214.8,32.0 270.2,-0.0"
                  fill={isFulfilled ? '#1f6e42' : '#92400E'}
                  stroke="#3a3a3a"
                  strokeWidth=".8"
                  strokeLinejoin="round"
                />
                <polygon
                  points="214.8,-32.0 270.2,-0.0 214.8,32.0 159.3,-0.0"
                  fill={isFulfilled ? '#6ee7a0' : '#FCD34D'}
                  stroke="#3a3a3a"
                  strokeWidth=".8"
                  strokeLinejoin="round"
                />
              </g>
            ) : null}

            {/* Deferred Order 1 (Dashed Pink-Red Wireframe Outline) */}
            {deferred1 && (
              <g>
                <polygon
                  points="62.4,76.0 117.8,108.0 173.2,76.0 117.8,44.0"
                  fill="rgba(255, 122, 122, 0.08)"
                  stroke="#FF7A7A"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                />
                <line x1="62.4" y1="176.0" x2="62.4" y2="76.0" stroke="#FF7A7A" strokeWidth="1.2" strokeDasharray="4 3" />
                <line x1="117.8" y1="208.0" x2="117.8" y2="108.0" stroke="#FF7A7A" strokeWidth="1.2" strokeDasharray="4 3" />
                <line x1="173.2" y1="176.0" x2="173.2" y2="76.0" stroke="#FF7A7A" strokeWidth="1.2" strokeDasharray="4 3" />
              </g>
            )}

            {/* Deferred Order 2 (Dashed Pink-Red Wireframe Outline) */}
            {deferred2 && (
              <g>
                <polygon
                  points="-6.9,136.0 48.5,168.0 103.9,136.0 48.5,104.0"
                  fill="rgba(255, 122, 122, 0.08)"
                  stroke="#FF7A7A"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                />
                <line x1="-6.9" y1="216.0" x2="-6.9" y2="136.0" stroke="#FF7A7A" strokeWidth="1.2" strokeDasharray="4 3" />
                <line x1="48.5" y1="248.0" x2="48.5" y2="168.0" stroke="#FF7A7A" strokeWidth="1.2" strokeDasharray="4 3" />
                <line x1="103.9" y1="216.0" x2="103.9" y2="136.0" stroke="#FF7A7A" strokeWidth="1.2" strokeDasharray="4 3" />
              </g>
            )}

            {/* Pill Label 1: Stock Remaining (Real API computed value) */}
            <g>
              <line x1="0.0" y1="8.0" x2="0.0" y2="-6.0" stroke="#3a3a3a" />
              <rect x="-62" y="-28.0" width="124" height="22" rx="11" fill="#161616" stroke="#3a3a3a" />
              <text x="0.0" y="-13.0" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#fff" fontWeight="500">
                Stock: {metrics.remainingStock} left
              </text>
            </g>

            {/* Pill Label 2: Allocated Order (Real Customer Name & Real Quantities) */}
            {primaryAllocated && (
              <g>
                <line x1="214.8" y1="0.0" x2="214.8" y2="-14.0" stroke="#3a3a3a" />
                <rect x="145" y="-36.0" width="140" height="22" rx="11" fill="#161616" stroke="#3a3a3a" />
                <text x="214.8" y="-21.0" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill={isFulfilled ? '#4ADE80' : '#F5B544'} fontWeight="500">
                  {primaryAllocated.customer_name?.split(' ')?.[0] || 'Cust'} {primaryAllocated.allocated_quantity}/{primaryAllocated.requested_quantity}
                </text>
              </g>
            )}

            {/* Pill Label 3: Deferred Order 1 (Real Customer Name & Real Quantities) */}
            {deferred1 && (
              <g>
                <line x1="117.8" y1="76.0" x2="117.8" y2="62.0" stroke="#3a3a3a" />
                <rect x="52" y="40.0" width="132" height="22" rx="11" fill="#161616" stroke="#3a3a3a" />
                <text x="117.8" y="55.0" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#FF7A7A" fontWeight="500">
                  {deferred1.customer_name?.split(' ')?.[0] || 'Cust'} {deferred1.allocated_quantity}/{deferred1.requested_quantity}
                </text>
              </g>
            )}

            {/* Pill Label 4: Deferred Order 2 (Real Customer Name & Real Quantities) */}
            {deferred2 && (
              <g>
                <line x1="48.5" y1="136.0" x2="48.5" y2="122.0" stroke="#3a3a3a" />
                <rect x="-18" y="100.0" width="132" height="22" rx="11" fill="#161616" stroke="#3a3a3a" />
                <text x="48.5" y="115.0" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#FF7A7A" fontWeight="500">
                  {deferred2.customer_name?.split(' ')?.[0] || 'Cust'} {deferred2.allocated_quantity}/{deferred2.requested_quantity}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend Footnote */}
        <div className="pt-4 border-t border-[#2A2A2A] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#A8A8A8]">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#4ADE80] inline-block" />
              <span>Allocated (Solid Box)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-[#FF7A7A] inline-block" />
              <span>Unmet Demand (Dashed Wireframe)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2c2c2c] border border-[#3a3a3a] inline-block" />
              <span>Remaining Stock Pile</span>
            </span>
          </div>
          <span className="text-[#8A8A8A] flex items-center space-x-1">
            <Info className="h-3.5 w-3.5" />
            <span>Deterministic Allocation Model</span>
          </span>
        </div>
      </div>
    </div>
  );
}
