<script lang="ts">
	const metadata = {
		title: 'Contact — Rick De',
		description:
			'Get in touch about workplace systems, AI orchestration, or design + technology consulting.',
		url: 'https://rdtect.com/contact',
		image: 'https://rdtect.com/og/home.svg'
	};

	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let errorMessage = $state('');

	const FORMSPREE_ENDPOINT = 'https://formspree.io/f/REPLACE_ME';

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		status = 'submitting';
		errorMessage = '';

		try {
			const res = await fetch(FORMSPREE_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, subject, message })
			});

			if (res.ok) {
				status = 'success';
				name = '';
				email = '';
				subject = '';
				message = '';
			} else {
				const body = await res.json();
				throw new Error(body.error || 'Submission failed');
			}
		} catch (err) {
			status = 'error';
			errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again or email directly.';
		}
	}
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
	<header class="mb-10">
		<h1 class="text-4xl font-bold">Contact</h1>
		<p class="mt-4 text-lg text-gray-600">
			Interested in workplace systems, AI orchestration, or design + technology consulting?
			Send a message and I'll get back to you.
		</p>
	</header>

	<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
		{#if status === 'success'}
			<div class="flex flex-col items-center py-8 text-center">
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
					<svg class="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 6L9 17l-5-5" />
					</svg>
				</div>
				<h2 class="mt-4 text-xl font-semibold text-gray-900">Message Sent</h2>
				<p class="mt-2 text-gray-600">Thanks for reaching out. I'll get back to you soon.</p>
				<button
					class="mt-6 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
					onclick={() => status = 'idle'}
				>
					Send Another Message
				</button>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-5">
				<div class="grid gap-5 sm:grid-cols-2">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
						<input
							id="name"
							type="text"
							bind:value={name}
							required
							placeholder="Your name"
							class="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						/>
					</div>
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							placeholder="you@example.com"
							class="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
						/>
					</div>
				</div>

				<div>
					<label for="subject" class="block text-sm font-medium text-gray-700">Subject</label>
					<input
						id="subject"
						type="text"
						bind:value={subject}
						placeholder="What's this about?"
						class="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					/>
				</div>

				<div>
					<label for="message" class="block text-sm font-medium text-gray-700">Message</label>
					<textarea
						id="message"
						bind:value={message}
						required
						rows="5"
						placeholder="Tell me about your project, idea, or question..."
						class="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
					></textarea>
				</div>

				{#if status === 'error'}
					<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{errorMessage}
						<br />
						You can also email directly: <a href="mailto:hello@rdtect.com" class="font-medium underline">hello@rdtect.com</a>
					</div>
				{/if}

				<button
					type="submit"
					disabled={status === 'submitting'}
					class="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if status === 'submitting'}
						Sending...
					{:else}
						Send Message
					{/if}
				</button>

				<p class="text-xs text-gray-400 text-center">
					Or email directly at <a href="mailto:hello@rdtect.com" class="text-indigo-600 underline">hello@rdtect.com</a>
				</p>
			</form>
		{/if}
	</div>
</article>

<style>
	:global(body) {
		background-color: #f9fafb;
	}
</style>
