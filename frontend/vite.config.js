import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const apiTarget = env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'

  return {
    plugins: [react()],

    server: {
      port: 5173,
      host: true,
      // Dev proxy — avoids CORS issues during development
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      // Split vendor chunks for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            icons: ['lucide-react'],
          },
        },
      },
    },
  }
})
