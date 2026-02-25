import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
	// Load .env from repo root (where docker-compose.yml also reads it)
	envDir: '../../',
	plugins: [
		sveltekit(),
		// Module Federation for loading external apps
		...(isDev ? [federation({
			name: 'desktopHost',
			remotes: {
				// Federation remotes - these apps need to be running for federation to work
				'excalidraw-remote': 'http://localhost:5004/assets/remoteEntry.js',
			},
			// Don't share React - let remotes bundle their own version
			shared: [],
		})] : []),
	],
	server: {
		port: 5176,
		strictPort: false,
		cors: true,
		fs: {
			// Allow serving files from the plugins directory
			allow: ['src', 'plugins', 'node_modules', '.svelte-kit'],
		},
		proxy: {
			// Proxy federation remotes to avoid CORS issues
			'/federation/excalidraw': {
				target: 'http://localhost:5004',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/federation\/excalidraw/, ''),
			},
		},
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			// Externalize federation remotes for production build
			external: isDev ? [] : [
				'excalidraw-remote/Excalidraw',
			],
		},
	},
});
