import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: true,
  },

  build: {
    // Emit a manifest for bundle analysis
    manifest: true,

    // Increase the warning threshold to 600 kB (default 500 kB)
    // so Vite doesn't warn on our admin-chunk which carries Recharts.
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        /**
         * Manual chunk strategy — keeps the main entry small and splits
         * large dependency groups into cacheable chunks:
         *
         *  vendor   — react / react-dom / react-router (always needed)
         *  charts   — recharts (large, only loaded on chart pages)
         *  icons    — lucide-react (medium, shared across admin pages)
         *  admin    — all pages under /admin/*
         *  customer — all customer-facing pages
         *  auth     — login + register
         */
        manualChunks(id) {
          // Core React ecosystem — always needed
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor';
          }

          // Recharts — only loaded on chart-heavy pages
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts';
          }

          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // Axios + other small utilities
          if (id.includes('node_modules/axios')) {
            return 'vendor';
          }

          // Admin page group
          if (id.includes('/src/pages/admin/')) {
            return 'admin';
          }

          // Customer page group
          if (id.includes('/src/pages/customer/')) {
            return 'customer';
          }

          // Auth pages
          if (
            id.includes('/src/pages/Login') ||
            id.includes('/src/pages/Register')
          ) {
            return 'auth';
          }
        },
      },
    },
  },
});
