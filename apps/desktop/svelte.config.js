import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	compilerOptions: {
		experimental: {
			async: true
		}
	},

	kit: {
		adapter: adapterNode(),
		// Load .env from repo root (shared with docker-compose)
		env: {
			dir: '../../'
		},
		experimental: {
			remoteFunctions: true
		}
	}
};

export default config;
