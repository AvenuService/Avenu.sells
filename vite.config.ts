import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'SUPABASE_', 'NEXT_PUBLIC_'],
  server: { port: 5173, open: true },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@types/three')) return 'three';
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
            if (id.includes('@supabase')) return 'supabase';
          }
        },
      },
    },
  },
})
