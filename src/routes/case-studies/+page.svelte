<script lang="ts">
	// Case studies sourced from 1_Atlas/personal/brand/content/2026/07/
	// CDO spec: 3_Efforts/rdtect/content/case-studies-page-spec.md (S300, 2026-08-12)

	interface CaseStudy {
		slug: string;
		title: string;
		client: string;
		category: string;
		scale: string;
		excerpt: string;
		status: 'draft' | 'blocked';
		blockerNote?: string;
	}

	const caseStudies: CaseStudy[] = [
		{
			slug: 'iff-hyderabad-gbs-hub',
			title: 'IFF Hyderabad GBS Hub — Sensescape of Innovation',
			client: 'IFF (International Flavors & Fragrances)',
			category: 'Sensory Design, Workplace Strategy',
			scale: '75,000 sq ft, 600 people, 2 floors',
			excerpt: "When a company's product is fragrance — when their R&D is literally the science of sensory experience — and their workplace smells like every other office building, something has gone wrong. We designed the IFF Hyderabad hub as a sensescape: 7 sensory zones calibrated to the science of how sensory input shapes cognitive output.",
			status: 'draft'
		},
		{
			slug: '7eleven-bengaluru',
			title: '7-Eleven Bengaluru — Urban Playground',
			client: '7-Eleven',
			category: 'Workplace Design, Brand Experience',
			scale: 'Bengaluru GCC',
			excerpt: "How do you take a convenience store brand and turn it into a workplace that competes with the best tech offices in Bengaluru? You don't build a store. You build a playground. An urban playground concept that translates retail brand cues into modern tech workspace patterns.",
			status: 'draft'
		},
		{
			slug: 'fidelity-bengaluru',
			title: 'Fidelity Bengaluru — Tech-Forward Trust',
			client: 'Fidelity Investments',
			category: 'Financial Services, Workplace Technology',
			scale: 'Bengaluru office',
			excerpt: "Fidelity's brand says 'trust us with your retirement.' Their Bengaluru office needed to say 'trust us with your career.' Same institution. Radically different workplace conversation. We designed a tech-forward trust language — warm materials paired with cutting-edge tech infrastructure.",
			status: 'blocked',
			blockerNote: 'Awaiting site photography — case study content is written and reviewed.'
		}
	];

	const metadata = {
		title: 'Case Studies — Rick De',
		description: 'Workplace design and technology projects — sensory design, brand experience, and tech-forward workspaces.',
		url: 'https://rdtect.com/case-studies',
		image: 'https://rdtect.com/og/case-studies.svg'
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
		<h1 class="text-4xl font-bold">Case Studies</h1>
		<p class="mt-4 text-lg text-gray-600">
			Selected workplace design and technology projects. Where spatial design meets systems thinking.
		</p>
	</header>

	<!-- Featured case study (IFF) -->
	{#if caseStudies.length > 0}
		{@const featured = caseStudies[0]}
		<article class="mb-10 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
			<span class="inline-block rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-600">
				Featured Project
			</span>
			<div class="mt-4">
				<div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
					<span class="font-medium text-gray-700">{featured.client}</span>
					<span>·</span>
					<span>{featured.category}</span>
					<span>·</span>
					<span>{featured.scale}</span>
				</div>
				<h2 class="mt-2 text-2xl font-semibold text-gray-900">
					{featured.title}
				</h2>
				<p class="mt-3 text-gray-600 leading-relaxed">
					{featured.excerpt}
				</p>
			</div>
		</article>
	{/if}

	<!-- Remaining case studies -->
	<div class="grid gap-6 sm:grid-cols-2">
		{#each caseStudies.slice(1) as cs}
			<article class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
				<div class="flex flex-wrap items-center gap-2 text-xs text-gray-500">
					<span class="font-medium text-gray-700">{cs.client}</span>
					<span>·</span>
					<span>{cs.scale}</span>
				</div>
				<h2 class="mt-2 text-lg font-semibold text-gray-900">
					{cs.title}
				</h2>
				<p class="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
					{cs.excerpt}
				</p>
				<div class="mt-3 flex items-center gap-2">
					<span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{cs.category}</span>
					{#if cs.status === 'blocked'}
						<span class="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700" title={cs.blockerNote}>
							Coming soon
						</span>
					{:else}
						<span class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700">
							Draft ready
						</span>
					{/if}
				</div>
			</article>
		{/each}
	</div>

	<!-- Bottom CTA -->
	<div class="mt-12 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-8 text-center">
		<h2 class="text-xl font-semibold text-gray-900">Have a project in mind?</h2>
		<p class="mt-2 text-gray-600">Let's talk about your workplace, your challenges, and what's possible.</p>
		<a href="/contact" class="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
			Get in touch →
		</a>
	</div>
</article>

<style>
	:global(body) {
		background-color: #f9fafb;
	}
</style>
