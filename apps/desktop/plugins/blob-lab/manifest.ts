import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
	id: 'blob-lab',
	name: 'Blob Lab',
	version: '1.0.0',
	type: 'native',
	icon: '🫧',
	description: 'Interactive metaball animation playground',
	access: 'free',
	entry: './src/BlobLab.svelte',
	category: 'creative',
	priority: 20,
	showOnDesktop: true,
	defaultWidth: 600,
	defaultHeight: 500,
	minWidth: 450,
	minHeight: 380,
	singleton: true,
	resizable: true
};

export default manifest;
