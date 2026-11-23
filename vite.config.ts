import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/dse-pc-prob-calculator/',
  server: { allowedHosts: ['.manus.computer'] },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
