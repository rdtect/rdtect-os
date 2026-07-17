<script lang="ts">
	const metadata = {
		title: 'AI is an Intern, Not a Master',
		description:
			'Long-form piece on AI as a force multiplier, not a replacement. Explore how domain expertise combined with AI capability creates true leverage.',
		url: 'https://rdtect.com/writing/2026/07/ai-as-intern',
		image: 'https://rdtect.com/og/ai-as-intern.png' // hero image will come from visual commission
	};
</script>

<svelte:head>
	<title>{metadata.title} — Rick De</title>
	<meta name="description" content={metadata.description} />

	<!-- Open Graph -->
	<meta property="og:title" content={metadata.title} />
	<meta property="og:description" content={metadata.description} />
	<meta property="og:url" content={metadata.url} />
	<meta property="og:type" content="article" />
	<meta property="og:image" content={metadata.image} />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={metadata.title} />
	<meta name="twitter:description" content={metadata.description} />
	<meta name="twitter:image" content={metadata.image} />

	<!-- Article metadata -->
	<meta property="article:published_time" content="2026-07-17" />
	<meta property="article:author" content="Rick De" />
	<meta property="article:tag" content="AI" />
	<meta property="article:tag" content="Leverage" />
	<meta property="article:tag" content="Domain Knowledge" />
</svelte:head>

<article class="mx-auto max-w-2xl px-4 py-12">
	<header class="mb-12">
		<time class="text-sm text-gray-600">July 17, 2026</time>
		<h1 class="mt-2 text-4xl font-bold">{metadata.title}</h1>
		<p class="mt-4 text-lg text-gray-600">{metadata.description}</p>
	</header>

	<div class="prose prose-lg max-w-none">
		<p>
			The mistake isn't that people use AI too much. It's that they treat it wrong.
		</p>

		<p>
			They talk to it like an oracle: ask a question, take the answer as gospel. Or throw prompts at
			it without knowing what they're doing, hoping it figures it out. Then they're shocked when it
			hallucinates—as if the model, not the human, is supposed to know.
		</p>

		<p>
			Here's the reframe: <strong>AI is an intern, not a master.</strong> Brilliant. Fast. Not the
			boss.
		</p>

		<hr />

		<h2>Two Traps</h2>

		<h3>Trap #1: AI as Oracle</h3>

		<p>
			You ask, "Should we pivot to AI?" and your model writes back a 2,000-word strategic plan. You
			read it once and move to the next thing.
		</p>

		<p>That's oracle thinking. And it ends badly.</p>

		<p>
			The model doesn't know your market. Doesn't know your constraints. Doesn't know which
			decisions have killed companies. It synthesizes training data, but synthesis isn't strategy.
			Strategy is judgment. That comes from you.
		</p>

		<p>
			The oracle trap is seductive because the output <em>feels</em> authoritative. Articulate.
			Right. That's what language models do—they compress patterns into prose that sounds certain.
		</p>

		<p>But sounding certain isn't being right.</p>

		<h3>Trap #2: Domain Ignorance</h3>

		<p>
			Throw AI at a domain you don't understand and expect it to fill the gap. It won't.
		</p>

		<p>
			A founder with no spatial design background asks an AI to design a restaurant. The output
			looks professional. It misses the kitchen sightline. Misses the acoustic dead spot that kills
			conversation. Misses the code that just changed. These aren't hallucinations—they're domain
			gaps. The model doesn't know <em>this restaurant's</em> constraints. Only the founder does.
		</p>

		<p>
			Same with an engineer who doesn't understand their business asking an AI to write sales copy.
			The model lists features. But it doesn't know the one feature that matters to your buyer is
			the one nobody publicly admits they need. Your domain knowledge catches it. The model doesn't.
		</p>

		<hr />

		<h2>The Real Bottleneck</h2>

		<p>Here's what people miss: <strong>information isn't scarce anymore. Wisdom is.</strong></p>

		<p>
			Your AI can research anything in seconds. Synthesize datasets. Generate 100 variations on an
			idea. Done.
		</p>

		<p>
			The hard part is knowing which of those 100 matters. Which research finding applies to your
			situation. What to ignore. How to move.
		</p>

		<p>Wisdom is yours. Speed is theirs.</p>

		<hr />

		<h2>The Framework</h2>

		<pre><code>Domain Knowledge (yours) × AI Capability (theirs) = Leverage

Without domain knowledge:  0 × ∞ = 0
Without AI:                ∞ × 0 = still slow
With both:                 real × fast = wisdom at scale</code></pre>

		<p>
			An intern can research everything. But only someone with domain knowledge looks at the
			research and says: "This is the 10% that matters. This is what we build. This is what we
			ignore."
		</p>

		<p>That's you. That's always been you.</p>

		<p>
			All AI does is remove the speed constraint so your judgment can operate at scale.
		</p>

		<hr />

		<h2>How This Works in Practice</h2>

		<p>I run this every day.</p>

		<p>
			<strong>Claude Code is the thinking partner.</strong> Architects solutions, spots errors,
			explores 50 options in the time I'd think through two. I set the direction. I make the calls.
			Yes or no.
		</p>

		<p>
			<strong>Agents are specialists.</strong> Research, review, draft, analyze—faster than I can alone.
			But I review their work before it ships. They never make architecture decisions without me.
		</p>

		<p>
			<strong>The vault is wisdom, not information.</strong> Every entry is distilled, linked, positioned.
			When I ask an agent to consult it, they're not searching—they're referencing judgment that already
			proved true.
		</p>

		<p><strong>The rhythm keeps both of us sharp:</strong></p>
		<ul>
			<li>Notice what matters in the world</li>
			<li>Engage AI to research, draft, explore</li>
			<li>Mull on what actually changed</li>
			<li>Exchange learnings back into the vault</li>
		</ul>

		<p>That rhythm is everything. No oracle worship. No domain ignorance. Just thinking at speed.</p>

		<hr />

		<h2>The Proof</h2>

		<p>This isn't theory.</p>

		<p>
			<strong>My father applies this to physics.</strong> He has 45 years of domain expertise in
			automotive engineering. When we built RapidAI—a system to predict engine performance—we didn't
			ask the model to invent new physics. We encoded 263 physics rules based on his judgment. Then we
			let the system apply those rules faster than any human could. The model wasn't smarter than the
			domain expert. It was his domain expertise operating at machine speed.
		</p>

		<p>That's the intern model. The physicist directs. The machine executes.</p>

		<p>
			<strong>I've seen this work in product too.</strong> A PM at a company I work with had a mandate:
			"Zero hallucinations in our AI features." That sounds technical, but it's not. It's a domain constraint.
			The PM knows what hallucinations cost in their market—trust, onboarding friction, retention. So they
			didn't ask the model to be perfect. They designed the system to never output uncertainty. The model
			stays in its lane. Domain knowledge set the boundary.
		</p>

		<p>
			<strong>At scale, it's orchestration.</strong> I run 20 AI agents. Each is a specialist. Some
			research, some review, some draft, some critique. But the direction is mine. The trade-offs are
			mine. The architecture is mine. The agents are fast. I'm the domain expert. Together, we're
			unstoppable.
		</p>

		<hr />

		<h2>The Corollary</h2>

		<p>
			The people who leverage AI most aren't the most technical. They're the domain experts who know what
			to ask and how to judge the answer.
		</p>

		<p>
			A surgeon using AI for diagnosis: the surgeon's judgment makes it work. AI is faster. The surgeon
			is right.
		</p>

		<p>
			An architect using AI for spatial design: the architect's eye matters. AI is faster. The vision is
			real.
		</p>

		<p>
			An investor using AI for pattern-finding: the investor's market knowledge makes it true. AI is faster.
			The investor owns the move.
		</p>

		<p>
			You already have the hard part. Expertise. Taste. Judgment. Speed was always the missing piece.
		</p>

		<p>Now you have it.</p>

		<hr />

		<h2>The Closing</h2>

		<p>
			You don't need to become an AI engineer. You might need to learn how to manage an intern. If
			you've managed people before, you already know the moves.
		</p>

		<p>
			The question isn't "Can I use AI?" It's "Am I treating my AI intern like a master, or like what
			it is?"
		</p>

		<p>
			Treat it right, and you get leverage you've never had.
		</p>

		<p>The work becomes the medium. Thinking becomes the product. Your domain expertise doesn't fade.</p>

		<p>It multiplies.</p>
	</div>
</article>

<style>
	:global(body) {
		background-color: #f9fafb;
	}

	:global(.prose) {
		color: #374151;
	}

	:global(.prose h2) {
		margin-top: 2rem;
		margin-bottom: 1rem;
		font-size: 1.875rem;
		font-weight: 700;
		color: #111827;
	}

	:global(.prose h3) {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
	}

	:global(.prose p) {
		margin-bottom: 1.25rem;
		line-height: 1.75;
	}

	:global(.prose ul) {
		margin-bottom: 1.25rem;
		padding-left: 2rem;
		list-style-type: disc;
	}

	:global(.prose li) {
		margin-bottom: 0.5rem;
	}

	:global(.prose hr) {
		margin: 2rem 0;
		border-color: #e5e7eb;
	}

	:global(.prose code) {
		background-color: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.9em;
		color: #6b7280;
	}

	:global(.prose pre) {
		background-color: #1f2937;
		padding: 1.5rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 1.25rem;
	}

	:global(.prose pre code) {
		background-color: transparent;
		color: #e5e7eb;
		padding: 0;
	}
</style>
