import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Navbar from '../src/components/layout/Navbar';
import Sidebar from '../src/components/layout/Sidebar';
import CustomerLayout from '../src/components/layout/CustomerLayout';
import { I18nProvider } from '../src/contexts/I18nContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';

let mockAuthUser = {
  id: 1,
  name: 'Admin User',
  role: 'admin',
  email: 'admin@orderwise.com',
};

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    token: 'mock-jwt-token',
    logout: vi.fn(),
  }),
}));

vi.mock('../src/contexts/AuthContext', () => {
  const React = require('react');
  return {
    AuthContext: React.createContext({
      user: mockAuthUser,
      token: 'mock-jwt-token',
      logout: vi.fn(),
    }),
    useAuth: () => ({
      user: mockAuthUser,
      token: 'mock-jwt-token',
      logout: vi.fn(),
    }),
    AuthProvider: ({ children }) => <div>{children}</div>,
  };
});

vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

function renderWithProviders(ui, { initialEntries = ['/admin'] } = {}) {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <NotificationProvider>
          <MemoryRouter initialEntries={initialEntries}>
            {ui}
          </MemoryRouter>
        </NotificationProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

describe('Global Navbar Alignment & Multi-Portal Responsive Architecture Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser = {
      id: 1,
      name: 'Admin User',
      role: 'admin',
      email: 'admin@orderwise.com',
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Admin Portal Navbar Alignment', () => {
    it('renders Admin Console badge, logo, breadcrumbs, and compact right-side controls', () => {
      renderWithProviders(<Navbar onToggleSidebar={vi.fn()} isSidebarOpen={true} />, {
        initialEntries: ['/admin/products'],
      });

      // Role pill badge
      const adminBadge = screen.getByText(/Admin console/i);
      expect(adminBadge).toBeInTheDocument();
      expect(adminBadge.className).toContain('text-ac');
      expect(adminBadge.className).toContain('shrink-0');

      // Logo wordmark
      const logoBrand = screen.getByText('Order');
      expect(logoBrand).toBeInTheDocument();

      // Breadcrumbs
      const breadcrumbProducts = screen.getByText(/Product Catalog/i);
      expect(breadcrumbProducts).toBeInTheDocument();

      // Language Switcher button
      const langBtn = screen.getByTestId('language-selector-button');
      expect(langBtn).toBeInTheDocument();
      expect(langBtn).toHaveTextContent(/English/i);

      // User Profile menu
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    it('displays full navigation options in Admin Sidebar', () => {
      renderWithProviders(<Sidebar mobileOpen={true} onCloseMobile={vi.fn()} />);

      expect(screen.getByText(/Administrator/i)).toBeInTheDocument();
      expect(screen.getByText(/Allocation Center/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Recommendations/i)).toBeInTheDocument();
      expect(screen.getByText(/Impact Analyzer/i)).toBeInTheDocument();
      expect(screen.getByText(/Simulation Lab/i)).toBeInTheDocument();
      expect(screen.getByText(/Product Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Inventory Management/i)).toBeInTheDocument();
    });
  });

  describe('2. Manager Portal Navbar Alignment', () => {
    beforeEach(() => {
      mockAuthUser = {
        id: 3,
        name: 'Inventory Manager',
        role: 'inventory_manager',
        email: 'manager@orderwise.com',
      };
    });

    it('renders Manager Portal badge with amber styling and maintains logo spacing', () => {
      renderWithProviders(<Navbar onToggleSidebar={vi.fn()} isSidebarOpen={true} />, {
        initialEntries: ['/admin/inventory'],
      });

      const managerBadge = screen.getByText(/Manager portal/i);
      expect(managerBadge).toBeInTheDocument();
      expect(managerBadge.className).toContain('text-wa');
      expect(managerBadge.className).toContain('shrink-0');
    });

    it('restricts sidebar to authorized inventory routes for manager role', () => {
      renderWithProviders(<Sidebar mobileOpen={true} onCloseMobile={vi.fn()} />);

      expect(screen.getByText(/Inventory Manager/i)).toBeInTheDocument();
      expect(screen.getByText(/Product Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Inventory Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Replenishment/i)).toBeInTheDocument();
      expect(screen.getByText(/Alerts/i)).toBeInTheDocument();

      // Restricted admin-only routes must not appear
      expect(screen.queryByText(/Allocation Center/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/AI Recommendations/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Impact Analyzer/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Simulation Lab/i)).not.toBeInTheDocument();
    });
  });

  describe('3. Customer Portal Navbar & Responsive Header', () => {
    beforeEach(() => {
      mockAuthUser = {
        id: 2,
        name: 'Alice Customer',
        role: 'customer',
        email: 'alice@demo.com',
      };
    });

    it('renders Customer Portal badge, brand logo, and all navigation links', () => {
      renderWithProviders(
        <Routes>
          <Route element={<CustomerLayout />}>
            <Route path="/dashboard" element={<div>Customer Content</div>} />
          </Route>
        </Routes>,
        { initialEntries: ['/dashboard'] }
      );

      // Customer badge
      const customerBadge = screen.getByText(/Customer portal/i);
      expect(customerBadge).toBeInTheDocument();
      expect(customerBadge.className).toContain('text-ac');
      expect(customerBadge.className).toContain('shrink-0');

      // Desktop and Laptop navigation items
      const catalogLinks = screen.getAllByText(/Catalog/i);
      expect(catalogLinks.length).toBeGreaterThan(0);

      const orderLinks = screen.getAllByText(/Orders/i);
      expect(orderLinks.length).toBeGreaterThan(0);

      // Dedicated AI Assistant button/pill
      const aiButtons = screen.getAllByText(/AI Assistant/i);
      expect(aiButtons.length).toBeGreaterThan(0);
    });

    it('toggles mobile drawer navigation cleanly when hamburger button is clicked', async () => {
      renderWithProviders(
        <Routes>
          <Route element={<CustomerLayout />}>
            <Route path="/dashboard" element={<div>Customer Content</div>} />
          </Route>
        </Routes>,
        { initialEntries: ['/dashboard'] }
      );

      const menuToggle = screen.getByLabelText(/Toggle navigation/i);
      expect(menuToggle).toBeInTheDocument();

      fireEvent.click(menuToggle);

      // Drawer is open, now check that Language header inside mobile drawer is displayed
      await waitFor(() => {
        expect(screen.getByText('Language')).toBeInTheDocument();
      });
    });
  });

  describe('4. Multilingual Alignment (English, Hindi, Marathi)', () => {
    it('switches languages smoothly without breaking navbar element layout', async () => {
      renderWithProviders(<Navbar onToggleSidebar={vi.fn()} isSidebarOpen={true} />);

      const langBtn = screen.getByTestId('language-selector-button');
      fireEvent.click(langBtn);

      // Select Hindi
      const hiOption = screen.getByText('हिन्दी');
      fireEvent.click(hiOption);

      await waitFor(() => {
        expect(langBtn).toHaveTextContent(/हिन्दी/i);
      });

      // Select Marathi
      fireEvent.click(langBtn);

      const mrOption = screen.getByText('मराठी');
      fireEvent.click(mrOption);

      await waitFor(() => {
        expect(langBtn).toHaveTextContent(/मराठी/i);
      });
    });
  });
});
