<script lang="ts">
  /**
   * Excalidraw - Federation Wrapper
   *
   * Loads Excalidraw from the remote federation app and mounts it.
   * Falls back to placeholder if the remote is unavailable.
   */
  import { onMount, onDestroy, tick } from "svelte";

  interface Props {
    windowId?: string;
  }

  let { windowId = "excalidraw-default" }: Props = $props();

  let containerRef: HTMLDivElement | undefined = $state();
  let loading = $state(true);
  let error = $state<string | null>(null);
  let reactRoot: { unmount: () => void } | null = null;

  async function mountExcalidraw() {
    // Wait for DOM to be ready
    await tick();

    // Wait a frame to ensure container is bound
    await new Promise(resolve => requestAnimationFrame(resolve));

    if (!containerRef) {
      console.error("[Excalidraw] Container ref not available");
      error = "Container not ready";
      loading = false;
      return;
    }

    console.log("[Excalidraw] Container ready, dimensions:", containerRef.offsetWidth, "x", containerRef.offsetHeight);

    // Vite federation exports get/init as ES module exports
    const REMOTE_ENTRY_URL = "/federation/excalidraw/assets/remoteEntry.js";
    const EXPOSED_MODULE = "./Excalidraw";

    try {
      console.log("[Excalidraw] Loading remote entry...");

      // Import the remote entry as an ES module
      const remoteEntry = await import(/* @vite-ignore */ REMOTE_ENTRY_URL);
      console.log("[Excalidraw] Remote entry loaded:", Object.keys(remoteEntry));

      // Initialize shared scope
      const shareScope = (globalThis as any).__federation_shared__ || {};
      await remoteEntry.init(shareScope);
      console.log("[Excalidraw] Share scope initialized");

      // Get the exposed module
      const factory = await remoteEntry.get(EXPOSED_MODULE);
      const module = await factory();
      console.log("[Excalidraw] Got module exports:", Object.keys(module));

      // Use the mount function from the remote - it uses its own bundled React 18
      const mountFn = module.mount;
      if (!mountFn) {
        throw new Error("Excalidraw module has no mount function");
      }

      // Set loading false BEFORE mounting to ensure container is visible
      loading = false;
      await tick();

      // Mount using the remote's bundled React
      if (containerRef) {
        console.log("[Excalidraw] Mounting with remote's React...");
        reactRoot = mountFn(containerRef, {
          onSave: handleSave
        });
        console.log("[Excalidraw] Component mounted successfully");
      }
    } catch (e) {
      console.error("[Excalidraw] Failed to load remote:", e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      error = `Failed to load Excalidraw: ${errorMsg}`;
      loading = false;
    }
  }

  onMount(() => {
    mountExcalidraw();
  });

  onDestroy(() => {
    if (reactRoot) {
      reactRoot.unmount();
    }
  });

  function handleSave(data: unknown) {
    // Save to localStorage
    const key = `excalidraw-${windowId}`;
    localStorage.setItem(key, JSON.stringify(data));
    console.log("[Excalidraw] Saved drawing");
  }
</script>

<!-- Container must always exist for React to mount into -->
<div class="excalidraw-wrapper" style="width: 100%; height: 100%; position: relative;">
  <!-- React mounts here -->
  <div bind:this={containerRef} class="excalidraw-container" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"></div>

  {#if loading}
    <div class="loading-overlay flex items-center justify-center bg-slate-900/95" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10;">
      <div class="text-center">
        <div
          class="animate-spin w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"
        ></div>
        <p class="text-slate-400 text-sm">Loading Excalidraw...</p>
        <p class="text-slate-500 text-xs mt-1">This may take a moment</p>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="error-overlay flex items-center justify-center bg-slate-900/95 p-6" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10;">
      <div class="text-center max-w-md">
        <span class="text-5xl mb-4 block">🎨</span>
        <h3 class="text-lg font-semibold text-slate-200 mb-2">
          Excalidraw Unavailable
        </h3>
        <p class="text-slate-400 text-sm mb-4">{error}</p>
        <div class="space-y-2">
          <code class="text-xs bg-slate-800 px-3 py-2 rounded block text-indigo-400">
            cd apps/excalidraw-remote
          </code>
          <code class="text-xs bg-slate-800 px-3 py-2 rounded block text-indigo-400">
            bun install && bun run dev
          </code>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.excalidraw) {
    --color-primary: #6366f1;
  }
</style>
