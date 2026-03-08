import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'LOGO.png', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'EduCard Generator',
        short_name: 'EduCard',
        description: 'Generate your cryptographic vCard matrix.',
        theme_color: '#0b0f12',
        background_color: '#0b0f12',
        display: 'standalone',
        icons: [
          {
            src: '192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
