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
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[12px] flex items-center space-x-1.5 text-t2">
      <Link
        to={pathnames[0] === 'admin' ? '/admin' : '/dashboard'}
        className="hover:text-white transition-colors flex items-center space-x-1"
        title="Dashboard Root"
      >
        <Home className="h-3 w-3" />
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const isNumber = !isNaN(Number(value));
        const label = isNumber ? `#${value}` : (ROUTE_LABELS[value] || value.charAt(0).toUpperCase() + value.slice(1));

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3 w-3 text-t2/50 shrink-0" />
            {isLast ? (
              <span className="text-white font-medium truncate max-w-[180px]">{label}</span>
            ) : (
              <Link to={to} className="hover:text-white transition-colors truncate max-w-[140px]">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
