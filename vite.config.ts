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
      // Set VITE_API_BASE_URL=/api/v1 to use it. The backend serves /v1/...
      // at its root, so the /api marker is stripped on the way through.
      '/api': {
        target: process.env.VITE_FASTAPI_ORIGIN ?? 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
