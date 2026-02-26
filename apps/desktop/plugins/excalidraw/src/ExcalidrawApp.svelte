<script lang="ts">
  /**
   * Excalidraw - Federation Wrapper with VFS Integration
   *
   * Loads Excalidraw from the remote federation app and mounts it.
   * Saves drawings to VFS at /home/user/Documents/drawings/*.excalidraw.
   * Falls back to placeholder if the remote is unavailable.
   */
  import { onMount, onDestroy, tick } from "svelte";
  import { vfs } from "$lib/core/vfs";
  import type { FileStat } from "$lib/core/vfs";

  interface Props {
    windowId?: string;
  }

  let { windowId = "excalidraw-default" }: Props = $props();

  const DRAWINGS_DIR = "/home/user/Documents/drawings";

  // Core state
  let containerRef: HTMLDivElement | undefined = $state();
  let loading = $state(true);
  let error = $state<string | null>(null);
  let reactRoot: { unmount: () => void } | null = null;

  // Current scene data (kept in memory for auto-save)
  let currentSceneData = $state<unknown>(null);

  // File management state
  let currentFilename = $state<string | null>(null);
  let isDirty = $state(false);

  // File picker modal
  let showFilePicker = $state(false);
  let pickerFiles = $state<FileStat[]>([]);
  let pickerLoading = $state(false);
  let selectedPickerFile = $state<string | null>(null);

  // Save As modal
  let showSaveAs = $state(false);
  let saveAsName = $state("");

  // Auto-save interval
  let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  // ── VFS helpers ──────────────────────────────────────────────────────────

  async function initVfs() {
    try {
      await vfs.mkdir(DRAWINGS_DIR, true);
      vfs.registerAssociation({
        extension: ".excalidraw",
        mimeType: "application/excalidraw+json",
        appId: "excalidraw",
        icon: "🎨",
        name: "Excalidraw Drawing",
      });
    } catch {
      // Directory may already exist; non-fatal
    }
  }

  async function saveToVfs(name: string, data: unknown): Promise<void> {
    const path = `${DRAWINGS_DIR}/${name}.excalidraw`;
    await vfs.writeFile(path, data as object);
  }

  async function loadFromVfs(path: string): Promise<unknown> {
    return await vfs.readJsonFile(path);
  }

  async function listDrawings(): Promise<FileStat[]> {
    try {
      const entries = await vfs.readdir(DRAWINGS_DIR);
      return entries.filter((f) => f.name.endsWith(".excalidraw"));
    } catch {
      return [];
    }
  }

  // ── Save logic ───────────────────────────────────────────────────────────

  async function saveCurrentDrawing(): Promise<void> {
    if (!currentSceneData) return;
    const name = currentFilename ?? generateDefaultName();
    // localStorage cache for instant restore
    localStorage.setItem(`excalidraw-${windowId}`, JSON.stringify(currentSceneData));
    // Persist to VFS
    await saveToVfs(name, currentSceneData);
    currentFilename = name;
    isDirty = false;
  }

  function generateDefaultName(): string {
    const now = new Date();
    return `drawing-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  }

  function handleSave(data: unknown) {
    currentSceneData = data;
    isDirty = true;
    // localStorage cache
    const key = `excalidraw-${windowId}`;
    localStorage.setItem(key, JSON.stringify(data));
    // Fire-and-forget VFS save if we have a filename
    if (currentFilename) {
      saveToVfs(currentFilename, data).catch(() => {});
    }
    if (import.meta.env.DEV) console.log("[Excalidraw] Saved drawing");
  }

  // ── Auto-save ────────────────────────────────────────────────────────────

  function startAutoSave() {
    autoSaveInterval = setInterval(async () => {
      if (isDirty && currentSceneData) {
        await saveCurrentDrawing();
      }
    }, 30_000);
  }

  // ── File Picker ──────────────────────────────────────────────────────────

  async function openFilePicker() {
    showFilePicker = true;
    pickerLoading = true;
    selectedPickerFile = null;
    pickerFiles = await listDrawings();
    pickerLoading = false;
  }

  async function confirmOpenFile() {
    if (!selectedPickerFile) return;
    try {
      const data = await loadFromVfs(selectedPickerFile);
      // Extract filename without extension
      const parts = selectedPickerFile.split("/");
      const basename = parts[parts.length - 1];
      currentFilename = basename.replace(/\.excalidraw$/, "");
      currentSceneData = data;
      isDirty = false;
      localStorage.setItem(`excalidraw-${windowId}`, JSON.stringify(data));
      // TODO: feed data back into Excalidraw canvas via mount options when supported
    } catch (e) {
      console.error("[Excalidraw] Failed to open file:", e);
    } finally {
      showFilePicker = false;
    }
  }

  // ── Save As ──────────────────────────────────────────────────────────────

  function openSaveAs() {
    saveAsName = currentFilename ?? generateDefaultName();
    showSaveAs = true;
  }

  async function confirmSaveAs() {
    const name = saveAsName.trim().replace(/\.excalidraw$/, "");
    if (!name) return;
    currentFilename = name;
    await saveCurrentDrawing();
    showSaveAs = false;
  }

  // ── New drawing ──────────────────────────────────────────────────────────

  function newDrawing() {
    currentFilename = null;
    currentSceneData = null;
    isDirty = false;
    localStorage.removeItem(`excalidraw-${windowId}`);
    // Excalidraw is inside a federated React app; reload it by remounting
    if (reactRoot) {
      reactRoot.unmount();
      reactRoot = null;
    }
    mountExcalidraw();
  }

  // ── Federation mount ─────────────────────────────────────────────────────

  async function mountExcalidraw() {
    loading = true;
    error = null;
    await tick();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    if (!containerRef) {
      error = "Container not ready";
      loading = false;
      return;
    }

    const REMOTE_ENTRY_URL = "/federation/excalidraw/assets/remoteEntry.js";
    const EXPOSED_MODULE = "./Excalidraw";

    try {
      if (import.meta.env.DEV) console.log("[Excalidraw] Loading remote entry...");
      const remoteEntry = await import(/* @vite-ignore */ REMOTE_ENTRY_URL);
      const shareScope = (globalThis as unknown as Record<string, unknown>).__federation_shared__ as Record<string, unknown> ?? {};
      await remoteEntry.init(shareScope);
      const factory = await remoteEntry.get(EXPOSED_MODULE);
      const module = await factory();

      const mountFn = module.mount;
      if (!mountFn) throw new Error("Excalidraw module has no mount function");

      loading = false;
      await tick();

      if (containerRef) {
        reactRoot = mountFn(containerRef, { onSave: handleSave });
        if (import.meta.env.DEV) console.log("[Excalidraw] Component mounted successfully");
      }
    } catch (e) {
      console.error("[Excalidraw] Failed to load remote:", e);
      error = `Failed to load Excalidraw: ${e instanceof Error ? e.message : String(e)}`;
      loading = false;
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  onMount(async () => {
    await initVfs();
    await mountExcalidraw();
    startAutoSave();
  });

  onDestroy(() => {
    if (reactRoot) reactRoot.unmount();
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    // Best-effort save on close
    if (isDirty && currentSceneData && currentFilename) {
      saveToVfs(currentFilename, currentSceneData).catch(() => {});
    }
  });

  // ── Formatting helpers ───────────────────────────────────────────────────

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }
</script>

<!-- ── Root wrapper ─────────────────────────────────────────────────────── -->
<div class="excalidraw-wrapper" style="width: 100%; height: 100%; position: relative; display: flex; flex-direction: column;">

  <!-- ── Toolbar ──────────────────────────────────────────────────────────── -->
  {#if !loading && !error}
    <div class="toolbar flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border-b border-slate-700/60 backdrop-blur-sm flex-shrink-0">
      <!-- New -->
      <button
        onclick={newDrawing}
        class="toolbar-btn flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors"
        title="New drawing"
      >
        <span>＋</span> New
      </button>

      <!-- Open -->
      <button
        onclick={openFilePicker}
        class="toolbar-btn flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors"
        title="Open from VFS"
      >
        <span>📂</span> Open
      </button>

      <!-- Save As -->
      <button
        onclick={openSaveAs}
        class="toolbar-btn flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/70 transition-colors"
        title="Save As"
      >
        <span>💾</span> Save As
      </button>

      <div class="h-4 w-px bg-slate-700 mx-1"></div>

      <!-- Current file -->
      <span class="text-xs text-slate-400 truncate max-w-[200px]" title={currentFilename ?? "Untitled"}>
        🎨 {currentFilename ?? "Untitled"}{isDirty ? " •" : ""}
      </span>
    </div>
  {/if}

  <!-- ── Canvas area ─────────────────────────────────────────────────────── -->
  <div style="flex: 1; position: relative; min-height: 0;">
    <!-- React mounts here -->
    <div bind:this={containerRef} class="excalidraw-container" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"></div>

    {#if loading}
      <div class="loading-overlay flex items-center justify-center bg-slate-900/95" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10;">
        <div class="text-center">
          <div class="animate-spin w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-400 text-sm">Loading Excalidraw...</p>
          <p class="text-slate-500 text-xs mt-1">This may take a moment</p>
        </div>
      </div>
    {/if}

    {#if error}
      <div class="error-overlay flex items-center justify-center bg-slate-900/95 p-6" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10;">
        <div class="text-center max-w-md">
          <span class="text-5xl mb-4 block">🎨</span>
          <h3 class="text-lg font-semibold text-slate-200 mb-2">Excalidraw Unavailable</h3>
          <p class="text-slate-400 text-sm mb-4">{error}</p>
          <div class="space-y-2">
            <code class="text-xs bg-slate-800 px-3 py-2 rounded block text-indigo-400">cd apps/excalidraw-remote</code>
            <code class="text-xs bg-slate-800 px-3 py-2 rounded block text-indigo-400">bun install && bun run dev</code>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- ── File Picker Modal ───────────────────────────────────────────────── -->
{#if showFilePicker}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    onclick={() => (showFilePicker = false)}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="modal-panel w-[500px] max-h-[420px] flex flex-col rounded-xl border border-slate-600/50 bg-slate-800/90 backdrop-blur-md shadow-2xl"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
        <h2 class="text-sm font-semibold text-slate-100">Open Drawing</h2>
        <button onclick={() => (showFilePicker = false)} class="text-slate-400 hover:text-white text-lg leading-none">✕</button>
      </div>

      <!-- File list -->
      <div class="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {#if pickerLoading}
          <div class="flex items-center justify-center py-10 text-slate-400 text-sm">Loading…</div>
        {:else if pickerFiles.length === 0}
          <div class="flex flex-col items-center justify-center py-10 text-slate-500">
            <span class="text-3xl mb-2">🗂️</span>
            <p class="text-sm">No drawings found in<br><code class="text-indigo-400 text-xs">{DRAWINGS_DIR}</code></p>
          </div>
        {:else}
          <ul class="space-y-1">
            {#each pickerFiles as file (file.path)}
              <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
              <li
                onclick={() => (selectedPickerFile = file.path)}
                ondblclick={confirmOpenFile}
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                  {selectedPickerFile === file.path
                    ? 'bg-indigo-600/30 border border-indigo-500/50'
                    : 'hover:bg-slate-700/50 border border-transparent'}"
              >
                <span class="text-xl flex-shrink-0">🎨</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-200 truncate">{file.name.replace(/\.excalidraw$/, "")}</p>
                  <p class="text-xs text-slate-500">{formatDate(file.modifiedAt)} · {formatBytes(file.size)}</p>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2 px-5 py-3 border-t border-slate-700/60">
        <button
          onclick={() => (showFilePicker = false)}
          class="px-4 py-1.5 text-xs rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
        >Cancel</button>
        <button
          onclick={confirmOpenFile}
          disabled={!selectedPickerFile}
          class="px-4 py-1.5 text-xs rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >Open</button>
      </div>
    </div>
  </div>
{/if}

<!-- ── Save As Modal ───────────────────────────────────────────────────── -->
{#if showSaveAs}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    onclick={() => (showSaveAs = false)}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="modal-panel w-[400px] rounded-xl border border-slate-600/50 bg-slate-800/90 backdrop-blur-md shadow-2xl"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
        <h2 class="text-sm font-semibold text-slate-100">Save As</h2>
        <button onclick={() => (showSaveAs = false)} class="text-slate-400 hover:text-white text-lg leading-none">✕</button>
      </div>

      <!-- Body -->
      <div class="px-5 py-4 space-y-3">
        <div>
          <label for="save-as-name" class="block text-xs font-medium text-slate-400 mb-1.5">Filename</label>
          <input
            id="save-as-name"
            type="text"
            bind:value={saveAsName}
            onkeydown={(e) => e.key === "Enter" && confirmSaveAs()}
            placeholder="my-drawing"
            class="w-full px-3 py-2 text-sm rounded-lg bg-slate-900/60 border border-slate-600/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <p class="text-xs text-slate-500 font-mono truncate">
          {DRAWINGS_DIR}/{saveAsName.trim() || "my-drawing"}.excalidraw
        </p>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2 px-5 py-3 border-t border-slate-700/60">
        <button
          onclick={() => (showSaveAs = false)}
          class="px-4 py-1.5 text-xs rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
        >Cancel</button>
        <button
          onclick={confirmSaveAs}
          disabled={!saveAsName.trim()}
          class="px-4 py-1.5 text-xs rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >Save</button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.excalidraw) {
    --color-primary: #6366f1;
  }
</style>
