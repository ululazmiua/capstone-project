import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  // Backend hanya mengizinkan http://localhost:5173, jadi port tidak boleh berpindah sendiri.
  server: {
    port: 5173,
    strictPort: true,
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
})
