import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      pages: "./src/pages",
    }
  },
  server: {
    port: 3003,
    host: '0.0.0.0',
    proxy: {
      '/backend': {
          target: 'http://localhost:3004',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/backend/, ''), 
      }
    },
  }
})
