import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3100',
      '/tours': 'http://localhost:3100',
      '/view': 'http://localhost:3100',
    },
  },
});
