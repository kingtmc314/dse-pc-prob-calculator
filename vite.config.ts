import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/dse-pc-prob-calculator/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
