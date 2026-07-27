<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import SiteNav from '$lib/content/SiteNav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if $page.url.pathname !== '/'}
	<SiteNav />
{/if}

{@render children()}
