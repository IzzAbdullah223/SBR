import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000, // Frontend runs on port 3000
    proxy: {
      //  Any request starting with /api gets forwarded to  backend
      // This means in your frontend you can use '/api/...' directly
      // instead of 'http://localhost:5000/api/...'
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})