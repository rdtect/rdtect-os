<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from './Scene.svelte';

	interface Props {
		windowId?: string;
	}

	let { windowId }: Props = $props();
	let ready = $state(false);

	$effect(() => {
		ready = true;
	});
</script>

<div class="experience-root">
	{#if ready}
		<Canvas>
			<Scene />
		</Canvas>
	{/if}
	<div class="overlay-label">
		<span class="label-text">3D Experience</span>
		<span class="label-hint">Drag to orbit · Scroll to zoom</span>
	</div>
</div>

<style>
	.experience-root {
		width: 100%;
		height: 100%;
		position: relative;
		background: #0a0a1a;
		overflow: hidden;
	}

	.experience-root :global(canvas) {
		width: 100% !important;
		height: 100% !important;
	}

	.overlay-label {
		position: absolute;
		bottom: 16px;
		left: 16px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		pointer-events: none;
		z-index: 10;
	}

	.label-text {
		font-family: var(--desktop-font-mono);
		font-size: var(--text-xs);
		color: rgba(99, 102, 241, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.label-hint {
		font-family: var(--desktop-font-sans);
		font-size: var(--text-xs);
		color: rgba(148, 163, 184, 0.4);
	}
</style>
