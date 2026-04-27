import adapterCloudflare from '@sveltejs/adapter-cloudflare';
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
		adapter: adapterCloudflare(),
		experimental: {
			remoteFunctions: true
		}
	}
};

export default config;
