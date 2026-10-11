import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill ResizeObserver for Recharts ResponsiveContainer in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock apiClient to return mock health response in test environment
vi.mock('../src/api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url) => {
      if (url === '/health') {
        return Promise.resolve({
          success: true,
          data: {
            status: 'healthy',
            service: 'orderwise-backend',
            timestamp: new Date().toISOString(),
            uptime: 42,
            environment: 'test',
            database: { connected: true, status: 'up' },
          },
        });
      }
      return Promise.resolve({ success: true, data: {} });
    }),
    post: vi.fn().mockResolvedValue({ success: true, data: {} }),
    put: vi.fn().mockResolvedValue({ success: true, data: {} }),
    delete: vi.fn().mockResolvedValue({ success: true, data: {} }),
  },
  API_BASE_URL: 'http://localhost:4000/api',
}));
