import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://127.0.0.1:8000',
      '/summary': 'http://127.0.0.1:8000',
      '/heatmap-data': 'http://127.0.0.1:8000',
      '/cases': 'http://127.0.0.1:8000',
      '/query': 'http://127.0.0.1:8000',
      '/geojson': 'http://127.0.0.1:8000',
    },
  },
});