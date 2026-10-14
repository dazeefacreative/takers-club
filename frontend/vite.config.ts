import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// Local backend for the dev proxy. Takers Club runs on 3001 locally so it can
// sit alongside other projects already using 3000 (set in backend/.env PORT).
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:3001'

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // ─── Dev proxy — forwards backend asset and API calls to Node backend ─────
  server: {
    // Fixed port so Paystack's local callback (APP_URL in backend/.env) always
    // lands on this project rather than whichever app grabbed 5173 first.
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
