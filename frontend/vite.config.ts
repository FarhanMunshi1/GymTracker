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
    proxy: {
      '/backend': {
          target: 'http://localhost:8000',
          rewrite: path => path.replace(/^\/backend/, ''), 
      }
    }
  }
})
