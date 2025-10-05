import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Point Cesium assets to the copies under public/cesium
    CESIUM_BASE_URL: JSON.stringify('/cesium/'),
  },
  server: {
    proxy: {
      '/power': {
        target: 'https://power.larc.nasa.gov',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/power/, ''),
      },
    },
  },
});
