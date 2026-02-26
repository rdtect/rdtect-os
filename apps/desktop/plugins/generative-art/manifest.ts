import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
	id: 'generative-art',
	name: 'Generative Art',
	version: '1.0.0',
	type: 'native',
	icon: '🎨',
	description: 'Algorithmic art generator — flow fields, circle packing, subdivision',
	access: 'free',
	entry: './src/GenerativeArt.svelte',
	category: 'creative',
	priority: 25,
	showOnDesktop: true,
	defaultWidth: 700,
	defaultHeight: 550,
	minWidth: 500,
	minHeight: 400,
	singleton: true,
	resizable: true
};

export default manifest;
