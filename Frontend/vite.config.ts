import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "SafeDeal - Secure Escrow Made Simple",
        short_name: "SafeDeal",
        description: "The world's most trusted escrow platform. Secure your deals, and trade with confidence.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#3b82f6",
        orientation: "portrait-primary",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["finance", "business", "productivity"],
        lang: "en",
        dir: "ltr"
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
    "ngrok-skip-browser-warning": true
    }
  },

  // ✅ Add this block for ngrok
  preview: {
    allowedHosts: [
      "elida-necktieless-unaspiringly.ngrok-free.dev"
    ],
    headers: {
    "ngrok-skip-browser-warning": true
    }
  }
})
