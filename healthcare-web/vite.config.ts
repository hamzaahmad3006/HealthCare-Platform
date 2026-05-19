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
});
