import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Tiffin Manager',
        short_name: 'Tiffin',
        description: 'Personal tiffin tracking & management system',
        theme_color: '#228be6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    // Use 127.0.0.1 (IPv4) — Windows resolves "localhost" to IPv6 [::1]
    // which causes proxy 500 errors and HMR WebSocket failures
    host: '127.0.0.1',
    hmr: {
      host: '127.0.0.1',
      clientPort: 3000,
    },
    proxy: {
      '/api': {
        // Must be 127.0.0.1, not "localhost" — same IPv6 issue
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/notifications', '@mantine/dates'],
          charts: ['@mantine/charts', 'recharts'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand', 'dayjs'],
        },
      },
    },
  },
});
