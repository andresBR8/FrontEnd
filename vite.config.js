import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Escucha en todas las interfaces de red
    port: process.env.PORT || 5173, // Usa el puerto proporcionado por Railway o 5173 como fallback
  },
  preview: {
    host: true, // Escucha en todas las interfaces de red
    port: process.env.PORT || 5173, // Usa el puerto proporcionado por Railway o 5173 como fallback
  },
});
