import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/, set through VITE_BASE.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Animation library in its own chunk so it is cached apart from app code.
        manualChunks: {
          motion: ['framer-motion'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // In development the API runs separately; in production Express serves the build.
    proxy: { '/api': process.env.VITE_API_PROXY || 'http://localhost:3333' },
  },
});
