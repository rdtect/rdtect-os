/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
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
