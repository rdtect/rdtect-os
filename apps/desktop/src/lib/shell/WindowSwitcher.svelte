<script lang="ts">
  import { wm } from './registry.svelte';
  import type { Window } from './window.svelte';

  interface Props {
    /** Whether the switcher is visible */
    open: boolean;
    /** Currently selected window index */
    selectedIndex: number;
    /** Callback when a window is selected */
    onSelect: (windowId: string) => void;
    /** Callback to close the switcher */
    onClose: () => void;
  }

  let { open, selectedIndex, onSelect, onClose }: Props = $props();

  // Get all windows (not just visible) for switching
  const allWindows = $derived(wm.windows);

  // Get the app definition for a window
  function getApp(appId: string) {
    return wm.getApp(appId);
  }

  // Handle click on a window thumbnail
  function handleWindowClick(win: Window) {
    onSelect(win.id);
    onClose();
  }

  // Keyboard navigation within the switcher
  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && allWindows.length > 0}
  <!-- Backdrop overlay -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
    onclick={onClose}
  >
    <!-- Window switcher panel -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="switcher-panel"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Title -->
      <div class="text-center mb-4">
        <h3 class="text-slate-300 text-sm font-medium tracking-wide">
          Switch Windows
        </h3>
        <p class="text-slate-500 text-xs mt-1">
          Release Alt to focus selected window
        </p>
      </div>

      <!-- Window thumbnails row -->
      <div class="flex gap-3 justify-center flex-wrap max-w-3xl">
        {#each allWindows as win, index (win.id)}
          {@const app = getApp(win.appId)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="window-thumbnail"
            class:selected={index === selectedIndex}
            class:minimized={win.isMinimized}
            onclick={() => handleWindowClick(win)}
          >
            <!-- Window preview -->
            <div class="thumbnail-preview">
              <!-- App icon as fallback preview -->
              <span class="text-4xl drop-shadow-lg">{app?.icon || '?'}</span>

              <!-- Minimized indicator -->
              {#if win.isMinimized}
                <div class="minimized-badge">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                  </svg>
                </div>
              {/if}
            </div>

            <!-- Window title -->
            <div class="thumbnail-title">
              <span class="text-xs mr-1">{app?.icon || '?'}</span>
              <span class="truncate">{win.title}</span>
            </div>

            <!-- Selection ring -->
            {#if index === selectedIndex}
              <div class="selection-ring"></div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Keyboard hints -->
      <div class="mt-4 flex justify-center gap-4 text-xs text-slate-500">
        <span class="flex items-center gap-1">
          <kbd class="kbd">Tab</kbd>
          Next
        </span>
        <span class="flex items-center gap-1">
          <kbd class="kbd">Shift+Tab</kbd>
          Previous
        </span>
        <span class="flex items-center gap-1">
          <kbd class="kbd">Esc</kbd>
          Cancel
        </span>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Switcher panel - glass morphism */
  .switcher-panel {
    background: linear-gradient(
      180deg,
      rgba(30, 41, 59, 0.85) 0%,
      rgba(15, 23, 42, 0.9) 100%
    );
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-radius: 1.5rem;
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    padding: 1.5rem 2rem;
    box-shadow:
      0 32px 64px -20px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(var(--desktop-accent-rgb), 0.15),
      0 0 80px -20px rgba(var(--desktop-accent-rgb), 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    animation: slide-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Window thumbnail */
  .window-thumbnail {
    position: relative;
    width: 140px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .window-thumbnail:hover {
    transform: translateY(-4px) scale(1.02);
  }

  .window-thumbnail.selected {
    transform: translateY(-4px) scale(1.05);
  }

  .window-thumbnail.minimized .thumbnail-preview {
    opacity: 0.5;
  }

  /* Thumbnail preview area */
  .thumbnail-preview {
    width: 100%;
    height: 90px;
    background: linear-gradient(
      180deg,
      rgba(51, 65, 85, 0.6) 0%,
      rgba(30, 41, 59, 0.8) 100%
    );
    border-radius: 0.75rem 0.75rem 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-bottom: none;
    transition: all 0.2s ease;
  }

  .window-thumbnail:hover .thumbnail-preview {
    background: linear-gradient(
      180deg,
      rgba(71, 85, 105, 0.6) 0%,
      rgba(51, 65, 85, 0.8) 100%
    );
  }

  .window-thumbnail.selected .thumbnail-preview {
    background: linear-gradient(
      180deg,
      rgba(var(--desktop-accent-rgb), 0.2) 0%,
      rgba(var(--desktop-accent-rgb), 0.1) 100%
    );
    border-color: rgba(var(--desktop-accent-rgb), 0.3);
  }

  /* Minimized badge */
  .minimized-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.5);
    color: #94a3b8;
    padding: 4px;
    border-radius: 4px;
  }

  /* Thumbnail title bar */
  .thumbnail-title {
    padding: 8px 10px;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-top: none;
    border-radius: 0 0 0.75rem 0.75rem;
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: #cbd5e1;
    transition: all 0.2s ease;
  }

  .window-thumbnail.selected .thumbnail-title {
    background: rgba(var(--desktop-accent-rgb), 0.15);
    color: #e2e8f0;
  }

  /* Selection ring */
  .selection-ring {
    position: absolute;
    inset: -2px;
    border: 2px solid rgba(var(--desktop-accent-rgb), 0.8);
    border-radius: 0.85rem;
    pointer-events: none;
    animation: pulse-ring 1.5s ease-in-out infinite;
    box-shadow: 0 0 20px rgba(var(--desktop-accent-rgb), 0.4);
  }

  /* Keyboard hint styling */
  .kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    background: rgba(51, 65, 85, 0.6);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 10px;
    color: #94a3b8;
    min-width: 20px;
    text-align: center;
  }

  /* Animations */
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes pulse-ring {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  .animate-fade-in {
    animation: fade-in 0.15s ease-out;
  }
</style>
