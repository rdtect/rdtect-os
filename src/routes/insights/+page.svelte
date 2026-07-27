<script lang="ts">
	import { insights } from '$lib/data/insights';

	const metadata = {
		title: 'Insights — Rick De',
		description:
			'Essays on AI, architecture, systems thinking, and the craft of building things that think.',
		url: 'https://rdtect.com/insights',
		image: 'https://rdtect.com/og/insights.svg'
	};
</script>

<svelte:head>
	<title>{metadata.title}</title>
	<meta name="description" content={metadata.description} />

	<meta property="og:title" content={metadata.title} />
	<meta property="og:description" content={metadata.description} />
	<meta property="og:url" content={metadata.url} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={metadata.image} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={metadata.title} />
	<meta name="twitter:description" content={metadata.description} />
	<meta name="twitter:image" content={metadata.image} />
</svelte:head>

<article class="mx-auto max-w-2xl px-4 py-12">
	<header class="mb-12">
		<h1 class="text-4xl font-bold">Insights</h1>
		<p class="mt-4 text-lg text-gray-600">
			Thoughts on AI, architecture, systems thinking, and designing at the intersection of physical and digital.
		</p>
	</header>

	<!-- Featured article (first) -->
	{#if insights.length > 0}
		{@const featured = insights[0]}
		<article class="mb-10 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
			<span class="inline-block rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-600">
				Featured
			</span>
			<a href={featured.href} class="group mt-3 block no-underline">
				<time class="text-sm text-gray-500">{featured.publishDate}</time>
				<h2 class="mt-1 text-2xl font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
					{featured.title}
				</h2>
				<p class="mt-3 text-gray-600 leading-relaxed">
					{featured.excerpt}
				</p>
				<div class="mt-4 flex flex-wrap gap-2">
					{#each featured.tags as tag}
						<span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{tag}</span>
					{/each}
				</div>
				<div class="mt-3 flex items-center gap-2 text-sm text-indigo-600 font-medium">
					Read article →
					<span class="text-gray-400 font-normal">{featured.readTime}</span>
				</div>
			</a>
		</article>
	{/if}

	<!-- Remaining articles grid -->
	<div class="grid gap-6 sm:grid-cols-2">
		{#each insights.slice(1) as article}
			<article class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
				<a href={article.href} class="group block no-underline">
					<time class="text-sm text-gray-500">{article.publishDate}</time>
					<h2 class="mt-1 text-lg font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
						{article.title}
					</h2>
					<p class="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
						{article.excerpt}
					</p>
					<div class="mt-3 flex flex-wrap gap-1.5">
						{#each article.tags.slice(0, 3) as tag}
							<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{tag}</span>
						{/each}
					</div>
					<div class="mt-2 flex items-center gap-2 text-sm">
						{#if article.status === 'voice-locked'}
							<span class="text-amber-600 font-medium">Coming soon</span>
							<span class="text-gray-400">{article.readTime}</span>
						{:else}
							<span class="text-indigo-600 font-medium">Read article →</span>
							<span class="text-gray-400">{article.readTime}</span>
						{/if}
					</div>
				</a>
			</article>
		{/each}
	</div>

	<!-- Newsletter CTA -->
	<div class="mt-12 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-8 text-center">
		<h2 class="text-xl font-semibold text-gray-900">Get these in your inbox</h2>
		<p class="mt-2 text-gray-600">Monthly essays on AI, architecture, and systems thinking.</p>
		<a href="/contact" class="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
			Subscribe →
		</a>
	</div>

	<!-- Link to full writing archive -->
	<div class="mt-8 text-center">
		<a href="/writing" class="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
			Browse all writing →
		</a>
	</div>
</article>

<style>
	:global(body) {
		background-color: #f9fafb;
	}
</style>
