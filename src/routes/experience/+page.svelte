<script lang="ts">
	// /experience — Book-a-Demo CTA page
	// CDO spec: 3_Efforts/rdtect/content/experience-page-spec.md (S300, 2026-08-12)
	// Interactive demos deferred to P2; current pivot is high-touch conversion

	interface Offering {
		id: string;
		title: string;
		description: string;
		duration: string;
		calLink: string;
	}

	const offerings: Offering[] = [
		{
			id: 'ai-readiness-sprint',
			title: 'AI Readiness Sprint',
			description: '90-minute workshop: audit your workflows, identify the 3 highest-ROI AI integration points, and leave with a ranked action plan tailored to your organization.',
			duration: '90 min',
			calLink: '#book-sprint'
		},
		{
			id: 'design-ai-consultation',
			title: 'Design + AI Consultation',
			description: 'For AEC firms and design-forward organizations. How to integrate AI into your practice without losing your design soul. Strategy, tools, and cultural change.',
			duration: '60 min',
			calLink: '#book-consult'
		},
		{
			id: 'agentic-workflow-design',
			title: 'Agentic Workflow Design',
			description: 'Custom multi-agent system architecture session. From single-prompt workflows to autonomous agent teams — design the system that scales with your ambition.',
			duration: '60 min',
			calLink: '#book-session'
		}
	];

	const proofPoints = [
		{ metric: '20', label: 'AI agents orchestrated in parallel', source: 'Production setup, Jul 2026' },
		{ metric: '$1 → $24', label: 'Monthly revenue per $1 of AI cost', source: 'Agentic Org Retrospective, Jul 2026' },
		{ metric: '75,000', label: 'Sq ft sensory workplace — IFF', source: 'IFF Hyderabad GBS Hub case study' },
		{ metric: '2,800+', label: 'Vault notes managed by agentic memory', source: 'rdtect OS vault, Aug 2026' }
	];

	const metadata = {
		title: 'Book a Demo — Rick De',
		description: 'Book a session on AI readiness, design + AI integration, or agentic workflow architecture. 30–90 minutes. Real outcomes.',
		url: 'https://rdtect.com/experience',
		image: 'https://rdtect.com/og/experience.svg'
	};

	let selectedOffering = $state<string | null>(null);
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
		<h1 class="text-4xl font-bold">Let's build something together</h1>
		<p class="mt-4 text-lg text-gray-600">
			30 minutes. Your problem. AI + design thinking applied in real time.
		</p>
	</header>

	<!-- Offerings -->
	<div class="space-y-5">
		{#each offerings as offering}
			<article class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1">
						<div class="flex items-center gap-3">
							<h2 class="text-lg font-semibold text-gray-900">{offering.title}</h2>
							<span class="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
								{offering.duration}
							</span>
						</div>
						<p class="mt-2 text-sm text-gray-600 leading-relaxed">
							{offering.description}
						</p>
					</div>
				</div>
				<div class="mt-4">
					<a
						href={offering.calLink}
						class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
						onclick={(e) => {
							// Calendar integration placeholder — replace with Cal.com link when ready
							selectedOffering = offering.id;
						}}
					>
						Book this session →
					</a>
				</div>
			</article>
		{/each}
	</div>

	<!-- Proof points -->
	<div class="mt-12 grid gap-4 sm:grid-cols-2">
		{#each proofPoints as pp}
			<div class="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
				<div class="text-2xl font-bold text-indigo-600">{pp.metric}</div>
				<div class="mt-1 text-sm text-gray-700">{pp.label}</div>
				<div class="mt-0.5 text-xs text-gray-400">{pp.source}</div>
			</div>
		{/each}
	</div>

	<!-- Calendar embed placeholder -->
	<div class="mt-10 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
		<div class="text-gray-500">
			<svg class="mx-auto h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<rect x="3" y="4" width="18" height="18" rx="2" />
				<path d="M16 2v4M8 2v4M3 10h18" />
			</svg>
			<p class="mt-3 text-sm font-medium">Calendar booking coming soon</p>
			<p class="mt-1 text-xs">In the meantime, reach out directly to schedule a session.</p>
			<a href="/contact" class="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800">
				Contact form →
			</a>
		</div>
	</div>

	<!-- "Not ready" fallback -->
	<div class="mt-10 border-t border-gray-200 pt-8 text-center">
		<p class="text-sm font-medium text-gray-700">Not ready to book? Read the thinking first.</p>
		<div class="mt-3 flex flex-wrap justify-center gap-3">
			<a href="/writing/2026/07/architects-natural-ai-leaders" class="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
				Architects Are Natural AI Leaders →
			</a>
			<a href="/insights" class="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
				Think in Systems, Not Prompts →
			</a>
			<a href="/insights" class="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
				The Double Diamond of AI Mastery →
			</a>
		</div>
	</div>
</article>

<style>
	:global(body) {
		background-color: #f9fafb;
	}
</style>
