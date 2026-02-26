import type { PluginManifest } from '$lib/core/types';

const manifest: PluginManifest = {
	id: '3d-experience',
	name: '3D Experience',
	version: '1.0.0',
	type: 'native',
	icon: '🌌',
	description: 'Immersive 3D scene — architecture, particles, and data visualization',
	access: 'free',
	entry: './src/Experience.svelte',
	category: 'creative',
	priority: 10,
	showOnDesktop: true,
	pinnedToTaskbar: true,
	defaultWidth: 800,
	defaultHeight: 600,
	minWidth: 600,
	minHeight: 400,
	singleton: true,
	resizable: true
};

export default manifest;
