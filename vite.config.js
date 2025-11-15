import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), 
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates the Service Worker
      manifest: {
        name: 'QuickRev', // Full App Name
        short_name: 'QuickRev', // Name under the icon
        description: 'Generate instant flashcards and reviewer at one click.',
        theme_color: '#4f46e5', // Primary color for OS interface elements
        icons: [
          // You must replace these with your actual icon files in the public folder
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable', // Required for adaptive icons
          },
        ],
      },
      // Essential for React Router (ensures navigation works offline)
      workbox: {
        navigateFallback: 'index.html',
      },
    }),
  ],
  /* server: {
    https: true,
    host: 'localhost'
  }, */
})
