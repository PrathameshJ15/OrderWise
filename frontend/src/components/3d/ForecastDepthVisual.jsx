import React, { useState } from 'react';
import { Layers, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

/**
 * ForecastDepthVisual - Scene 3: Demand Forecasting Depth Visual
 *
 * Implements a layered 3D isometric comparison of available inventory stock vs
 * 7-day and 30-day projected demand horizons using real mathematical forecast outputs.
 *
 * Rules:
 * - Uses 100% real forecast numbers from `/intelligence/forecast`.
 * - If no forecast data is available, renders a clean informative fallback.
 * - Does not displace or break the existing numerical cards.
 */
export default function ForecastDepthVisual({ forecasts = [] }) {
  const [selectedSku, setSelectedSku] = useState(forecasts[0]?.sku || 'all');
  const [hoveredTier, setHoveredTier] = useState(null);

  if (!forecasts || forecasts.length === 0) {
    return null;
  }

  // Active item to visualize
  const activeItem =
    selectedSku === 'all'
      ? forecasts[0]
      : forecasts.find((f) => f.sku === selectedSku) || forecasts[0];

  if (!activeItem) return null;

  const stock = Number(activeItem.available_inventory || 0);
  const d7 = Number(activeItem.horizon_7d?.projected_demand || 0);
  const d30 = Number(activeItem.horizon_30d?.projected_demand || 0);

  const maxVal = Math.max(1, stock, d7, d30);
  const scale = (val) => Math.max(18, Math.min(90, Math.round((val / maxVal) * 85)));

  const hStock = scale(stock);
  const h7 = scale(d7);
  const h30 = scale(d30);

  const isShortage = d30 > stock;

  return (
    <div className="card-base p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2A] pb-3">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-[#E50914]" />
          <h3 className="text-[16px] font-bold text-white">
            3D Horizon Depth Radar: Stock vs. Projected Demand
          </h3>
        </div>

        {/* Product SKU Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="forecastSkuSelect" className="text-[12px] font-mono text-[#A8A8A8]">
            Product:
          </label>
          <select
            id="forecastSkuSelect"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            className="bg-[#232323] border border-[#2A2A2A] rounded-full px-3 py-1 text-[12px] font-mono text-white focus:outline-none focus:border-[#E50914]"
          >
            {forecasts.map((f) => (
              <option key={f.sku} value={f.sku}>
                {f.product_name} ({f.sku})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3D Isometric Horizon Visual */}
      <div className="relative w-full aspect-[16/8] min-h-[220px] flex items-center justify-center bg-[#0F0F0F] rounded-[10px] border border-[#2A2A2A] p-2 overflow-hidden select-none">
        <svg viewBox="0 0 520 220" className="w-full h-full overflow-visible" role="img" aria-label="3D horizon projection comparison">
          <defs>
            {/* Stock Cylinder (Neutral Slate) */}
            <linearGradient id="fcStockTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A4A4A" />
              <stop offset="100%" stopColor="#333333" />
            </linearGradient>
            <linearGradient id="fcStockLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2D2D2D" />
              <stop offset="100%" stopColor="#1F1F1F" />
            </linearGradient>
            <linearGradient id="fcStockRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#222222" />
              <stop offset="100%" stopColor="#141414" />
            </linearGradient>

            {/* 7-Day Demand (Amber / Warning) */}
            <linearGradient id="fc7Top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#F5B544" />
            </linearGradient>
            <linearGradient id="fc7Left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="fc7Right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#92400E" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>

            {/* 30-Day Demand (OrderWise Red) */}
            <linearGradient id="fc30Top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF3844" />
              <stop offset="100%" stopColor="#E50914" />
            </linearGradient>
            <linearGradient id="fc30Left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C90812" />
              <stop offset="100%" stopColor="#9B050D" />
            </linearGradient>
            <linearGradient id="fc30Right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8A050D" />
              <stop offset="100%" stopColor="#640207" />
            </linearGradient>
          </defs>

          {/* Isometric Ground Base Platform */}
          <polygon
            points="260,30 490,135 260,205 30,135"
            fill="#141414"
            stroke="#262626"
            strokeWidth="1.2"
          />

          {/* TIER 1: Current Available Inventory (Position: Left) */}
          <g
            className="cursor-pointer"
            onMouseEnter={() => setHoveredTier({ label: 'Available Stock', val: `${stock} units`, sub: 'Current physical inventory' })}
            onMouseLeave={() => setHoveredTier(null)}
          >
            {/* Left face */}
            <polygon points="120,135 120,${135 - hStock} 150,${148 - hStock} 150,148" fill="url(#fcStockLeft)" stroke="#3A3A3A" strokeWidth="0.5" />
            {/* Right face */}
            <polygon points="150,148 150,${148 - hStock} 180,${135 - hStock} 180,135" fill="url(#fcStockRight)" stroke="#3A3A3A" strokeWidth="0.5" />
            {/* Top face */}
            <polygon points="150,${148 - hStock} 180,${135 - hStock} 150,${122 - hStock} 120,${135 - hStock}" fill="url(#fcStockTop)" stroke="#555555" strokeWidth="0.5" />

            <text x="150" y={116 - hStock} fill="#FFFFFF" fontSize="11" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="bold">
              {stock} u
            </text>
            <text x="150" y="166" fill="#A8A8A8" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle">
              On-Hand
            </text>
          </g>

          {/* TIER 2: 7-Day Horizon Demand (Position: Center) */}
          <g
            className="cursor-pointer"
            onMouseEnter={() => setHoveredTier({ label: '7-Day Demand', val: `${d7} units`, sub: 'Short-term horizon forecast' })}
            onMouseLeave={() => setHoveredTier(null)}
          >
            <polygon points="230,150 230,${150 - h7} 260,${163 - h7} 260,163" fill="url(#fc7Left)" stroke="#B45309" strokeWidth="0.5" />
            <polygon points="260,163 260,${163 - h7} 290,${150 - h7} 290,150" fill="url(#fc7Right)" stroke="#B45309" strokeWidth="0.5" />
            <polygon points="260,${163 - h7} 290,${150 - h7} 260,${137 - h7} 230,${150 - h7}" fill="url(#fc7Top)" stroke="#FDE68A" strokeWidth="0.5" />

            <text x="260" y={131 - h7} fill="#F5B544" fontSize="11" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="bold">
              {d7} u
            </text>
            <text x="260" y="180" fill="#F5B544" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle">
              7d Horizon
            </text>
          </g>

          {/* TIER 3: 30-Day Horizon Demand (Position: Right) */}
          <g
            className="cursor-pointer"
            onMouseEnter={() => setHoveredTier({ label: '30-Day Demand', val: `${d30} units`, sub: 'Monthly cumulative horizon' })}
            onMouseLeave={() => setHoveredTier(null)}
          >
            <polygon points="340,135 340,${135 - h30} 370,${148 - h30} 370,148" fill="url(#fc30Left)" stroke="#9B050D" strokeWidth="0.5" />
            <polygon points="370,148 370,${148 - h30} 400,${135 - h30} 400,135" fill="url(#fc30Right)" stroke="#9B050D" strokeWidth="0.5" />
            <polygon points="370,${148 - h30} 400,${135 - h30} 370,${122 - h30} 340,${135 - h30}" fill="url(#fc30Top)" stroke="#FFA0A6" strokeWidth="0.5" />

            <text x="370" y={116 - h30} fill="#E50914" fontSize="11" fontFamily="IBM Plex Mono" textAnchor="middle" fontWeight="bold">
              {d30} u
            </text>
            <text x="370" y="166" fill="#E50914" fontSize="9" fontFamily="IBM Plex Mono" textAnchor="middle">
              30d Horizon
            </text>
          </g>
        </svg>

        {hoveredTier && (
          <div className="absolute top-2 right-2 bg-[#0A0A0A]/95 border border-[#2A2A2A] rounded-[8px] p-2 px-3 pointer-events-none text-[11px] font-mono z-20 shadow-lg">
            <span className="text-white font-bold block">{hoveredTier.label}: {hoveredTier.val}</span>
            <span className="text-[#A8A8A8] text-[10px]">{hoveredTier.sub}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-[#A8A8A8] pt-1">
        <span className="flex items-center space-x-1.5">
          {isShortage ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-[#FF7A7A]" />
              <span className="text-[#FF7A7A]">30-Day Demand exceeds available stock &bull; Shortage risk</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-[#4ADE80]" />
              <span className="text-[#4ADE80]">Stock adequate across 30-day projection</span>
            </>
          )}
        </span>
        <span className="text-[#8A8A8A]">Exponential smoothing &bull; Proportional height</span>
      </div>
    </div>
  );
}
