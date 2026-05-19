import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@component': path.resolve(__dirname, './src/component'),
      '@constant': path.resolve(__dirname, './src/constant'),
      '@helper': path.resolve(__dirname, './src/helper'),
      '@redux': path.resolve(__dirname, './src/redux'),
      '@types': path.resolve(__dirname, './src/types'),
      '@pages': path.resolve(__dirname, './src/pages'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Vendor chunks isolate large dependencies that rarely change so
        // browser caching stays effective across application deploys.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'ui-vendor': ['@headlessui/react', 'lucide-react', 'react-hot-toast'],
          'utils-vendor': ['axios', 'clsx', 'date-fns', 'uuid'],
        },
      },
    },
  },
});
