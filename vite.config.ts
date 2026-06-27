import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/ - Force cache invalidate 1
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Use relative paths for any domain
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
})
