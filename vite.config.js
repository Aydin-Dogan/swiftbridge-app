import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Bundle-size optimalisatie (Verbetering G):
  // - vendor chunk voor react/react-dom/react-router-dom — gecached door
  //   browser, hoeft niet opnieuw geladen bij elke deploy.
  // - per-taal i18n chunks — alleen actieve taal geladen, niet alle 5.
  // - Verhoog chunk-size warning naar 600kb (vendor is groot maar OK gecached).
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React-vendor — groot maar uitstekend cacheable
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          // Per-taal i18n bundles — alleen actieve taal initieel geladen
          const taalMatch = id.match(/i18n\/(nl|en|tr|ru|az)\.js$/);
          if (taalMatch) {
            return `i18n-${taalMatch[1]}`;
          }
          // Andere node_modules in een aparte vendor-chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      devOptions: { enabled: false },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
      manifest: {
        name: 'SwiftBridge',
        short_name: 'SwiftBridge',
        description: 'Geld overmaken van Nederland naar Turkije in minder dan 5 minuten.',
        theme_color: '#2563EB',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'nl',
        categories: ['finance'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
