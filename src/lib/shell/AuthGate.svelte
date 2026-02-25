<script lang="ts">
  import { login, loginWithOAuth2, getAuthState } from '$lib/core/pocketbase';

  interface Props {
    onSuccess?: () => void;
    onDismiss?: () => void;
  }
  let { onSuccess, onDismiss }: Props = $props();

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleLogin() {
    loading = true;
    error = '';
    try {
      await login({ email, password });
      onSuccess?.();
    } catch (e: any) {
      error = e?.message || 'Login failed';
    } finally {
      loading = false;
    }
  }

  async function handleOAuth(provider: 'github') {
    loading = true;
    error = '';
    try {
      await loginWithOAuth2(provider);
      onSuccess?.();
    } catch (e: any) {
      error = e?.message || 'OAuth login failed';
    } finally {
      loading = false;
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onDismiss?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onDismiss?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
  onclick={handleBackdropClick}
  role="dialog"
  tabindex="-1"
  aria-modal="true"
  aria-label="Sign in to access this app"
>
  <div class="w-full max-w-sm mx-4 rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl animate-in">
    <div class="text-center mb-6">
      <div class="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
        <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-white">Sign In</h2>
      <p class="text-sm text-slate-400 mt-1">Access protected apps</p>
    </div>

    {#if error}
      <div class="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        {error}
      </div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
      <div>
        <input
          type="email"
          bind:value={email}
          placeholder="Email"
          required
          aria-label="Email address"
          class="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        />
      </div>
      <div>
        <input
          type="password"
          bind:value={password}
          placeholder="Password"
          required
          aria-label="Password"
          class="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        class="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>

    <div class="mt-4 flex items-center gap-3">
      <div class="flex-1 h-px bg-slate-700"></div>
      <span class="text-xs text-slate-500">or</span>
      <div class="flex-1 h-px bg-slate-700"></div>
    </div>

    <button
      onclick={() => handleOAuth('github')}
      disabled={loading}
      class="mt-4 w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      Continue with GitHub
    </button>

    <button
      onclick={() => onDismiss?.()}
      class="mt-3 w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
    >
      Continue as guest
    </button>
  </div>
</div>

<style>
  .animate-in {
    animation: authGateIn 0.2s ease-out;
  }
  @keyframes authGateIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
</style>
