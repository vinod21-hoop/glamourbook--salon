// vite.config.js — REPLACE entire file
// Remove the @tailwindcss/vite plugin (that's v4 only)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 5173,
  },
})