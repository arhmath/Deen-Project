import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Pisahkan library besar supaya di-cache terpisah & diunduh paralel.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('gsap')) return 'gsap'
          if (id.includes('framer-motion') || id.includes('/motion-')) return 'motion'
          if (id.includes('@tanstack')) return 'query'
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
        },
      },
    },
  },
})