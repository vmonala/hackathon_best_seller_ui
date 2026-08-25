import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Dev-time proxy so the browser can call FastAPI without CORS setup.
      // Set VITE_API_MODE=live and VITE_API_BASE_URL=/api to use it.
      '/api': {
        target: process.env.VITE_FASTAPI_ORIGIN ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
