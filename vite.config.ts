import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Vite handles process.env replacement in client code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});