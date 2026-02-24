import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'excalidrawRemote',
      filename: 'remoteEntry.js',
      exposes: {
        './Excalidraw': './src/ExcalidrawWrapper.tsx'
      },
      shared: []
    })
  ],
  server: {
    host: true,
    port: 5004,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 5004,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
});
