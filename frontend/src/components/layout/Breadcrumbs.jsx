import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  admin: 'Command Center',
  dashboard: 'Customer Hub',
  products: 'Product Catalog',
  inventory: 'Inventory Hub',
  orders: 'Orders',
  new: 'Create Order',
  allocation: 'Allocation Center',
  ai: 'AI Recommendations',
  impact: 'Impact Analyzer',
  simulations: 'Simulation Lab',
  alerts: 'Supply Alerts',
  replenishment: 'Replenishment Advisor',
  reports: 'Reports & Analytics',
  audit: 'Audit Log Viewer',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = (location?.pathname || '').split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="font-sans text-[13px] flex items-center space-x-1.5 text-t2 min-w-0 overflow-hidden">
      <Link
        to={pathnames[0] === 'admin' ? '/admin' : '/dashboard'}
        className="hover:text-t transition-colors flex items-center space-x-1 shrink-0"
        title="Dashboard Root"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const isNumber = !isNaN(Number(value));
        const label = isNumber ? `#${value}` : (ROUTE_LABELS[value] || value.charAt(0).toUpperCase() + value.slice(1));
        const isIntermediate = !isLast && index > 0;

        return (
          <React.Fragment key={to}>
            <ChevronRight className={`h-3 w-3 text-t2/50 shrink-0 ${isIntermediate ? 'hidden sm:inline-block' : ''}`} />
            {isLast ? (
              <span className="text-t font-semibold truncate max-w-[140px] sm:max-w-[180px] shrink-0">{label}</span>
            ) : (
              <Link to={to} className={`hover:text-t transition-colors truncate max-w-[110px] shrink-0 ${isIntermediate ? 'hidden sm:inline-block' : ''}`}>
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
