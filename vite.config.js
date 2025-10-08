import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    hmr: {
      overlay: true
    }
  },
  plugins: [
    vue(),
  ],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
    // Preserve certain modules from reloading
  optimizeDeps: {
    exclude: ['firebase/auth', 'firebase/app', 'firebase/firestore', 'firebase/storage']
  },
})
