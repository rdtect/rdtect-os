/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import os from 'node:os';

// Bound test-file parallelism: Svelte component compilation is CPU-bound, and
// vitest's default (nproc - 1) workers oversubscribes the machine — under
// full-suite load even a plain synchronous render could exceed 15s (RDT-1136
// flake). Cap at 4 workers and leave one core free; floor at 1 for tiny boxes.
const cpus =
	typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length;
const maxWorkers = Math.max(1, Math.min(4, cpus - 1));

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
		maxWorkers,
		// Svelte transform under parallel load is slow on this repo; give
		// user-event interaction tests headroom over the 5s default.
		// NB: vitest 4 config key is `testTimeout` — the legacy `test.timeout`
		// alias is silently ignored, which used to leave tests at 5s.
		testTimeout: 15000,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			include: ['packages/**/src/**/*.ts', 'src/lib/**/*.ts'],
			exclude: ['**/*.d.ts', '**/*.svelte.ts'],
		},
	},
});
