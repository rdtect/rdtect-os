<script lang="ts">
	import { page } from '$app/stores';

	let mobileNavOpen = $state(false);

	function isActive(path: string): boolean {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}
</script>

<nav class="site-nav">
	<div class="nav-inner mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
		<!-- Brand -->
		<a href="/" class="brand flex items-center gap-2 text-sm font-medium text-slate-200 transition-colors hover:text-white">
			<svg class="h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 2L2 7l10 5 10-5-10-5z" />
				<path d="M2 17l10 5 10-5" />
				<path d="M2 12l10 5 10-5" />
			</svg>
			<span>rdtect<span class="text-indigo-400"> OS</span></span>
		</a>

		<!-- Desktop links -->
		<div class="hidden items-center gap-6 sm:flex">
			<a href="/insights" class="nav-link text-sm text-slate-400 transition-colors hover:text-white" aria-current={isActive('/insights') ? 'page' : undefined}>
				Insights
			</a>
			<a href="/case-studies" class="nav-link text-sm text-slate-400 transition-colors hover:text-white" aria-current={isActive('/case-studies') ? 'page' : undefined}>
				Case Studies
			</a>
			<a href="/experience" class="nav-link text-sm text-slate-400 transition-colors hover:text-white" aria-current={isActive('/experience') ? 'page' : undefined}>
				Work With Me
			</a>
			<a href="/writing" class="nav-link text-sm text-slate-400 transition-colors hover:text-white" aria-current={isActive('/writing') ? 'page' : undefined}>
				Writing
			</a>
			<a href="/about" class="nav-link text-sm text-slate-400 transition-colors hover:text-white" aria-current={isActive('/about') ? 'page' : undefined}>
				About
			</a>
			<a href="/contact" class="ml-2 rounded-lg border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-all hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-200" aria-current={isActive('/contact') ? 'page' : undefined}>
				Contact
			</a>
		</div>

		<!-- Mobile menu toggle -->
		<button
			class="sm:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
			onclick={() => mobileNavOpen = !mobileNavOpen}
			aria-label="Toggle navigation"
		>
			{#if mobileNavOpen}
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			{:else}
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileNavOpen}
		<div class="sm:hidden border-t border-white/5 bg-slate-900/95 backdrop-blur-xl">
			<div class="flex flex-col gap-1 px-4 py-3">
				<a href="/insights" class="rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white" aria-current={isActive('/insights') ? 'page' : undefined}>
					Insights
				</a>
				<a href="/case-studies" class="rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white" aria-current={isActive('/case-studies') ? 'page' : undefined}>
					Case Studies
				</a>
				<a href="/experience" class="rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white" aria-current={isActive('/experience') ? 'page' : undefined}>
					Work With Me
				</a>
				<a href="/writing" class="rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white" aria-current={isActive('/writing') ? 'page' : undefined}>
					Writing
				</a>
				<a href="/about" class="rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white" aria-current={isActive('/about') ? 'page' : undefined}>
					About
				</a>
				<a href="/contact" class="mt-1 rounded-lg border border-indigo-500/30 px-3 py-2 text-center text-sm font-medium text-indigo-300 transition-colors hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-200" aria-current={isActive('/contact') ? 'page' : undefined}>
					Contact
				</a>
			</div>
		</div>
	{/if}
</nav>

<style>
	.site-nav {
		position: sticky;
		top: 0;
		z-index: 100;
		background: rgba(15, 23, 42, 0.85);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.nav-link {
		position: relative;
	}

	.nav-link[aria-current="page"] {
		color: #e2e8f0;
	}

	.nav-link[aria-current="page"]::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		right: 0;
		height: 2px;
		background: rgb(99, 102, 241);
		border-radius: 1px;
	}

	.brand {
		font-family: 'JetBrains Mono', 'SF Mono', monospace;
	}
</style>
