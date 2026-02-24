import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    svelte(),
    federation({
      name: 'promptManager',
      filename: 'remoteEntry.js',
      exposes: {
        './PromptManager': './src/PromptManager.svelte'
      },
      shared: ['svelte']
    })
  ],
  server: {
    host: true,
    port: 5003,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 5003,
    strictPort: true,
    cors: true
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
});
