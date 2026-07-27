/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		conditions: ['browser', 'development'],
	},
	test: {
		include: ['src/**/*.test.ts', 'packages/**/*.test.ts'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['packages/**/src/**/*.ts', 'src/lib/**/*.ts'],
			exclude: ['**/*.d.ts', '**/*.svelte.ts'],
		},
	},
});
