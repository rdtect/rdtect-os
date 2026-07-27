<script lang="ts">
	const metadata = {
		title: 'Writing — Rick De',
		description:
			'Essays on AI, architecture, systems thinking, and the craft of building things that think.',
		url: 'https://rdtect.com/writing',
		image: 'https://rdtect.com/og/writing.svg'
	};

	const articles = [
		{
			href: '/writing/2026/07/content-as-income-engine',
			title: 'Content as Income Engine: How Your Thinking Compounds Into Revenue',
			date: 'August 18, 2026',
			excerpt: "I didn't set out to make money from writing. I set out to think better. Three years later, the flywheel is real."
		},
		{
			href: '/writing/2026/07/architects-natural-ai-leaders',
			title: "Architects Are Natural AI Leaders (And Don't Know It Yet)",
			date: 'July 21, 2026',
			excerpt: "I didn't change careers three times. Same job, different mediums. Why architects have an unfair advantage in AI."
		},
		{
			href: '/writing/2026/07/ai-as-intern',
			title: 'AI is an Intern, Not a Master',
			date: 'July 17, 2026',
			excerpt: 'Long-form piece on AI as a force multiplier, not a replacement. Domain expertise combined with AI capability creates true leverage.'
		}
	];
</script>

<svelte:head>
	<title>{metadata.title}</title>
	<meta name="description" content={metadata.description} />

	<!-- Open Graph -->
	<meta property="og:title" content={metadata.title} />
	<meta property="og:description" content={metadata.description} />
	<meta property="og:url" content={metadata.url} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={metadata.image} />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={metadata.title} />
	<meta name="twitter:description" content={metadata.description} />
	<meta name="twitter:image" content={metadata.image} />
</svelte:head>

<article class="mx-auto max-w-2xl px-4 py-12">
	<header class="mb-12">
		<h1 class="text-4xl font-bold">Writing</h1>
		<p class="mt-4 text-lg text-gray-600">
			Essays on AI, architecture, systems thinking, and the craft of building things that think.
		</p>
	</header>

	<div class="space-y-8">
		{#each articles as article}
			<article class="border-b border-gray-200 pb-8 last:border-0">
				<a href={article.href} class="group block no-underline">
					<time class="text-sm text-gray-500">{article.date}</time>
					<h2 class="mt-1 text-2xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
						{article.title}
					</h2>
					<p class="mt-2 text-gray-600 leading-relaxed">
						{article.excerpt}
					</p>
				</a>
			</article>
		{/each}
	</div>
</article>

<style>
	:global(body) {
		background-color: #f9fafb;
	}
</style>
