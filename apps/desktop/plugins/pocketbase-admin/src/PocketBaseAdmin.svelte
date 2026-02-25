<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';

  interface Props {
    windowId?: string;
  }

  let { windowId }: Props = $props();

  // Get PocketBase URL from environment, with fallback to localhost
  const pocketbaseUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
  const adminUrl = `${pocketbaseUrl}/_/`;

  // Connection states
  let isLoading = $state(true);
  let isConnected = $state(false);
  let error = $state<string | null>(null);
  let retryCount = $state(0);

  // Check if PocketBase is running
  async function checkConnection(): Promise<boolean> {
    try {
      // Try to fetch the PocketBase health endpoint
      const response = await fetch(`${pocketbaseUrl}/api/health`, {
        method: 'GET',
        mode: 'cors',
      });
      return response.ok;
    } catch {
      // If CORS blocks us, try a different approach - just load the iframe
      // and let the browser handle it
      return true; // Assume it might work
    }
  }

  async function initializeConnection() {
    isLoading = true;
    error = null;

    const connected = await checkConnection();

    if (connected) {
      isConnected = true;
    } else {
      error = 'Unable to connect to PocketBase. Please ensure it is running.';
      isConnected = false;
    }

    isLoading = false;
  }

  function handleRetry() {
    retryCount++;
    initializeConnection();
  }

  function handleIframeLoad() {
    isLoading = false;
    isConnected = true;
    error = null;
  }

  function handleIframeError() {
    isLoading = false;
    isConnected = false;
    error = 'Failed to load PocketBase Admin UI. Please check if PocketBase is running.';
  }

  onMount(() => {
    initializeConnection();
  });
</script>

<div class="w-full h-full flex flex-col bg-desktop-bg">
  {#if isLoading}
    <!-- Loading State -->
    <div class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="w-12 h-12 border-4 border-desktop-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-slate-400 text-sm">Connecting to PocketBase...</p>
      <p class="text-slate-500 text-xs">{adminUrl}</p>
    </div>
  {:else if error && !isConnected}
    <!-- Error/Offline State -->
    <div class="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <div class="text-6xl">🗄️</div>
      <div class="text-center max-w-md">
        <h2 class="text-xl font-semibold text-slate-200 mb-2">PocketBase Not Available</h2>
        <p class="text-slate-400 text-sm mb-4">{error}</p>
        <div class="bg-desktop-surface rounded-lg p-4 text-left">
          <p class="text-slate-300 text-sm font-medium mb-2">To start PocketBase:</p>
          <code class="block bg-slate-900 rounded p-3 text-green-400 text-xs font-mono">
            ./pocketbase serve --http="0.0.0.0:8090"
          </code>
          <p class="text-slate-500 text-xs mt-3">
            Expected URL: <span class="text-slate-400">{pocketbaseUrl}</span>
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button
          onclick={handleRetry}
          class="px-4 py-2 bg-desktop-accent hover:bg-desktop-accent/80 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Retry Connection
        </button>
        <a
          href={adminUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-2 bg-desktop-surface hover:bg-desktop-border text-slate-300 rounded-lg text-sm font-medium transition-colors"
        >
          Open in Browser
        </a>
      </div>
      {#if retryCount > 0}
        <p class="text-slate-500 text-xs">Retry attempts: {retryCount}</p>
      {/if}
    </div>
  {:else}
    <!-- Connected - Show Iframe -->
    <iframe
      src={adminUrl}
      title="PocketBase Admin"
      class="w-full h-full border-none"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
      onload={handleIframeLoad}
      onerror={handleIframeError}
    ></iframe>
  {/if}
</div>

<style>
  /* Ensure iframe takes full space */
  iframe {
    background: white;
  }
</style>
