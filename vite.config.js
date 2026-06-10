import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // ১. প্লাগইনটি অবশ্যই ইমপোর্ট করতে হবে

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // এখানে আপনার সব ইমেজ ফরম্যাটগুলো আছে কিনা নিশ্চিত করুন
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'] 
      },
      manifest: {
        name: 'NextGen E-Commerce',
        short_name: 'NextGen',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})