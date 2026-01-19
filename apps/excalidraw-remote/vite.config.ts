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
      // Don't share React - bundle our own React 18 to avoid version conflicts with host
      shared: []
    })
  ],
  server: {
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
