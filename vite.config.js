import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'StockVista — Stock Research',
        short_name: 'StockVista',
        description: 'SEBI Registered Research Analyst. Expert equity, F&O, and commodity research calls.',
        theme_color: '#0f172a',
        background_color: '#f0f4f8',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['finance', 'business'],
        shortcuts: [
          {
            name: 'Live Calls',
            url: '/live-calls',
            description: 'View live research calls',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Dashboard',
            url: '/dashboard',
            description: 'My research dashboard',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/s3\.tradingview\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'tradingview-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 } },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
