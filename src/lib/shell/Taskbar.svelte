<script lang="ts">
  import { onDestroy } from 'svelte';
  import { wm } from './registry.svelte';
  import type { AppDefinition, MenuItem } from './types';
  import { Window } from './snap-zones.svelte';
  import { getAuthState } from '$lib/core/pocketbase';
  import { mobile } from '$lib/core/mobile.svelte';
  import { pluginBadges } from './constants';

  // Props
  let {
    onOpenLauncher,
    onContextMenu,
    onShowAppInfo,
    onSignInClick,
    onLaunchApp,
    taskbarLocked = false,
    showSearch = true,
    showWidgets = true,
    showTaskView = true,
    onTaskbarSettingsChange,
  }: {
    onOpenLauncher?: () => void;
    onContextMenu?: (e: MouseEvent, items: MenuItem[]) => void;
    onShowAppInfo?: (app: AppDefinition, view: 'source' | 'architecture' | 'docs') => void;
    onSignInClick?: () => void;
    onLaunchApp?: (appId: string) => void;
    taskbarLocked?: boolean;
    showSearch?: boolean;
    showWidgets?: boolean;
    showTaskView?: boolean;
    onTaskbarSettingsChange?: (settings: { locked?: boolean; showSearch?: boolean; showWidgets?: boolean; showTaskView?: boolean }) => void;
  } = $props();

  // Auth state (reactive)
  let isAuthenticated = $derived(getAuthState().isValid);
  let authModel = $derived(getAuthState().model);

  // Track pinned apps (initially all registered apps are pinned)
  let pinnedAppIds = $state<Set<string>>(new Set());

  // Initialize pinned apps when apps change
  $effect(() => {
    if (wm.apps.length > 0 && pinnedAppIds.size === 0) {
      pinnedAppIds = new Set(wm.apps.map(app => app.id));
    }
  });

  function isPinned(appId: string): boolean {
    return pinnedAppIds.has(appId);
  }

  function pinApp(appId: string): void {
    pinnedAppIds = new Set([...pinnedAppIds, appId]);
  }

  function unpinApp(appId: string): void {
    const newSet = new Set(pinnedAppIds);
    newSet.delete(appId);
    pinnedAppIds = newSet;
  }

  // Hover state for preview popups
  let hoveredApp = $state<string | null>(null);
  let tooltipTimeout: ReturnType<typeof setTimeout>;
  let previewDelay = 400; // Delay before showing preview

  function showPreview(appId: string) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      hoveredApp = appId;
    }, previewDelay);
  }

  function hidePreview() {
    clearTimeout(tooltipTimeout);
    hoveredApp = null;
  }

  // Get current time for clock display
  let time = $state(new Date());
  const clockInterval = setInterval(() => {
    time = new Date();
  }, 1000);

  // Cleanup interval and timeout on destroy
  onDestroy(() => {
    clearInterval(clockInterval);
    clearTimeout(tooltipTimeout);
  });

  const timeStr = $derived(
    time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
  const dateStr = $derived(
    time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  );

  // Get all unique apps (pinned + running)
  const taskbarApps = $derived.by(() => {
    const pinnedApps = wm.apps.filter(app => isPinned(app.id));
    const runningAppIds = new Set(wm.windows.map(w => w.appId));
    const runningUnpinnedApps = wm.apps.filter(
      app => runningAppIds.has(app.id) && !isPinned(app.id)
    );
    return [...pinnedApps, ...runningUnpinnedApps];
  });

  // Check if app has an open window
  function hasOpenWindow(appId: string): boolean {
    return wm.windows.some(w => w.appId === appId);
  }

  // Get all windows for a specific app
  function getAppWindows(appId: string): Window[] {
    return wm.windows.filter(w => w.appId === appId);
  }

  // Close all windows for a specific app
  function closeAllAppWindows(appId: string) {
    const windows = getAppWindows(appId);
    windows.forEach(w => wm.closeWindow(w.id));
  }

  // Helper: launch app through Desktop's auth-aware launcher or fallback to wm
  function openAppWindow(appId: string) {
    if (onLaunchApp) {
      onLaunchApp(appId);
    } else {
      wm.openWindow(appId);
    }
  }

  // Handle taskbar icon click
  function handleIconClick(app: AppDefinition) {
    const appWindows = getAppWindows(app.id);

    if (appWindows.length === 0) {
      // No windows open - open a new one
      openAppWindow(app.id);
    } else if (appWindows.length === 1) {
      // Single window - toggle minimize or focus
      const win = appWindows[0];
      if (win.isMinimized) {
        win.isMinimized = false;
        wm.focusWindow(win.id);
      } else if (win.isFocused) {
        win.minimize();
      } else {
        wm.focusWindow(win.id);
      }
    } else {
      // Multiple windows - cycle through them or show preview
      const focusedIdx = appWindows.findIndex(w => w.isFocused);
      if (focusedIdx >= 0) {
        const nextIdx = (focusedIdx + 1) % appWindows.length;
        wm.focusWindow(appWindows[nextIdx].id);
      } else {
        wm.focusWindow(appWindows[0].id);
      }
    }
  }

  // Handle right-click context menu for taskbar icon
  function handleIconContextMenu(e: MouseEvent, app: AppDefinition) {
    e.preventDefault();
    e.stopPropagation();

    const isRunning = hasOpenWindow(app.id);
    const appWindows = getAppWindows(app.id);
    const pinned = isPinned(app.id);
    const supportsMultipleInstances = !app.singleton;

    const items: MenuItem[] = [];

    // App title header
    items.push({
      label: app.title,
      icon: app.icon,
      disabled: true,
    });
    items.push({ separator: true, label: '' });

    // Open option (only if not running or supports multiple instances)
    if (!isRunning) {
      items.push({
        label: 'Open',
        action: () => openAppWindow(app.id),
      });
    }

    // New Window (if supports multiple instances)
    if (supportsMultipleInstances) {
      items.push({
        label: 'New Window',
        action: () => openAppWindow(app.id),
      });
    }

    // Close All Windows (if running)
    if (isRunning && appWindows.length > 0) {
      items.push({
        label: appWindows.length === 1 ? 'Close Window' : `Close All (${appWindows.length})`,
        action: () => closeAllAppWindows(app.id),
      });
    }

    // Separator before pin options
    items.push({ separator: true, label: '' });

    // Pin/Unpin option
    if (pinned) {
      items.push({
        label: 'Unpin from Taskbar',
        action: () => unpinApp(app.id),
      });
    } else {
      items.push({
        label: 'Pin to Taskbar',
        action: () => pinApp(app.id),
      });
    }

    onContextMenu?.(e, items);
  }

  // Focus a specific window from preview
  function focusWindowFromPreview(windowId: string) {
    const win = wm.windows.find(w => w.id === windowId);
    if (win) {
      if (win.isMinimized) {
        win.isMinimized = false;
      }
      wm.focusWindow(windowId);
    }
    hidePreview();
  }

  // Close a specific window from preview
  function closeWindowFromPreview(e: MouseEvent, windowId: string) {
    e.stopPropagation();
    wm.closeWindow(windowId);
  }
</script>

{#if mobile.isMobile}
  <!-- Mobile: iOS/Android-style bottom dock -->
  <div class="mobile-dock fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
    <div class="mobile-dock-glass px-3 pt-2 pb-1">
      <!-- Running apps row (if any) -->
      {#if wm.windows.length > 0}
        <div class="flex items-center justify-center gap-1 mb-2 px-2">
          {#each wm.windows as win (win.id)}
            {@const app = wm.getApp(win.appId)}
            {#if app}
              <div class="relative flex items-center gap-1.5">
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors
                    {win.isFocused ? 'bg-desktop-accent/30 text-white' : 'bg-white/10 text-slate-300'}"
                  onclick={() => {
                    if (win.isMinimized) { win.isMinimized = false; wm.focusWindow(win.id); }
                    else if (win.isFocused) { wm.minimizeWindow(win.id); }
                    else { wm.focusWindow(win.id); }
                  }}
                >
                  <span class="text-sm">{app.icon}</span>
                  <span class="max-w-[60px] truncate">{app.title}</span>
                </button>
                <button
                  class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center hover:bg-red-500/80"
                  aria-label="Close {win.title}"
                  onclick={() => wm.closeWindow(win.id)}
                >
                  <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Dock icons -->
      <div class="flex items-center justify-around">
        <!-- Pinned quick-launch icons (first 5 apps) -->
        {#each wm.apps.slice(0, 5) as app (app.id)}
          <button
            class="mobile-dock-icon flex flex-col items-center justify-center w-14 h-14 rounded-2xl active:scale-90 transition-transform duration-100"
            onclick={() => { if (onLaunchApp) onLaunchApp(app.id); else wm.openWindow(app.id); }}
          >
            <span class="text-2xl">{app.icon}</span>
            <span class="text-[9px] text-slate-400 mt-0.5 truncate max-w-[48px]">{app.title}</span>
          </button>
        {/each}

        <!-- App drawer button -->
        <button
          class="mobile-dock-icon flex flex-col items-center justify-center w-14 h-14 rounded-2xl active:scale-90 transition-transform duration-100"
          onclick={() => onOpenLauncher?.()}
        >
          <svg class="w-6 h-6 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/>
            <circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>
            <circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
          </svg>
          <span class="text-[9px] text-slate-400 mt-0.5">Apps</span>
        </button>
      </div>

      <!-- Home indicator bar -->
      <div class="flex justify-center mt-1.5 pb-1">
        <div class="w-32 h-1 rounded-full bg-white/20"></div>
      </div>
    </div>
  </div>
{:else}
  <!-- Desktop: Modern Windows 11 / macOS style Taskbar -->
  <div class="taskbar-container fixed bottom-0 left-1/2 -translate-x-1/2 z-50">
    <div class="taskbar-glass flex items-center gap-1 px-2 py-1.5 rounded-2xl">

      <!-- Start Button -->
      <button
        class="start-button group relative w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        onclick={() => onOpenLauncher?.()}
        title="Start Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
        </svg>
      </button>

      <!-- Divider -->
      <div class="taskbar-divider"></div>

      <!-- Centered App Icons -->
      <div class="flex items-center gap-1.5 px-1 max-w-[calc(100vw-280px)] overflow-x-auto scrollbar-none">
        {#each taskbarApps as app (app.id)}
          {@const isRunning = hasOpenWindow(app.id)}
          {@const isHovered = hoveredApp === app.id}
          {@const appWindows = getAppWindows(app.id)}
          {@const hasFocusedWindow = appWindows.some(w => w.isFocused && !w.isMinimized)}
          {@const badge = pluginBadges[app.pluginType]}

          <div class="relative">
            <!-- Window Preview Popup -->
            {#if isHovered && isRunning && appWindows.length > 0}
              <div class="preview-popup absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[60]">
                <div class="preview-container bg-desktop-surface/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                  <!-- App Header -->
                  <div class="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <span class="text-lg">{app.icon}</span>
                    <span class="text-sm font-medium text-white">{app.title}</span>
                    <span class="ml-auto px-1.5 py-0.5 text-[9px] font-medium rounded {badge?.color} text-white">
                      {badge?.label}
                    </span>
                  </div>

                  <!-- Window Thumbnails -->
                  <div class="flex gap-2 p-2 max-w-[400px] overflow-x-auto">
                    {#each appWindows as win (win.id)}
                      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                      <div
                        class="preview-thumbnail group/thumb relative flex-shrink-0 w-[150px] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2 {win.isFocused ? 'border-desktop-accent' : 'border-transparent hover:border-white/20'}"
                        onclick={() => focusWindowFromPreview(win.id)}
                        role="button"
                        tabindex="0"
                      >
                        <!-- Thumbnail placeholder (gradient representing window) -->
                        <div class="w-full h-[90px] bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                          <span class="text-3xl opacity-50">{app.icon}</span>
                          {#if win.isMinimized}
                            <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span class="text-xs text-white/60">Minimized</span>
                            </div>
                          {/if}
                        </div>

                        <!-- Window Title -->
                        <div class="px-2 py-1.5 bg-slate-800/80">
                          <span class="text-[11px] text-slate-300 truncate block">{win.title}</span>
                        </div>

                        <!-- Close Button -->
                        <button
                          class="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-600/80 text-white/70 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-150"
                          aria-label="Close {win.title}"
                          onclick={(e) => closeWindowFromPreview(e, win.id)}
                        >
                          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
                <!-- Arrow -->
                <div class="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-desktop-surface/95 border-r border-b border-white/10 rotate-45"></div>
              </div>
            {:else if isHovered && !isRunning}
              <!-- Simple Tooltip for non-running apps -->
              <div class="tooltip-popup absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[60]">
                <div class="bg-desktop-surface/95 backdrop-blur-xl px-3 py-2 rounded-lg border border-white/10 shadow-xl whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-white">{app.title}</span>
                    <span class="px-1.5 py-0.5 text-[9px] font-medium rounded {badge?.color} text-white">
                      {badge?.label}
                    </span>
                  </div>
                </div>
                <div class="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-desktop-surface/95 border-r border-b border-white/10 rotate-45"></div>
              </div>
            {/if}

            <!-- App Icon Button -->
            <button
              class="taskbar-icon relative w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none
                {hasFocusedWindow ? 'taskbar-icon-focused' : ''}
                {isRunning ? 'taskbar-icon-running' : ''}"
              onclick={() => handleIconClick(app)}
              oncontextmenu={(e) => handleIconContextMenu(e, app)}
              onmouseenter={() => showPreview(app.id)}
              onmouseleave={hidePreview}
            >
              <span class="text-2xl drop-shadow-md transition-transform duration-150">{app.icon}</span>

              <!-- Lock badge for protected apps -->
              {#if app.plugin?.manifest?.access === 'protected' && !isAuthenticated}
                <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                  <svg class="w-2 h-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              {/if}

              <!-- Running Indicator -->
              {#if isRunning}
                <span class="running-indicator absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full bg-white/80
                  {hasFocusedWindow ? 'w-5 bg-desktop-accent' : 'w-1.5'}
                  {appWindows.length > 1 ? 'multi-window' : ''}"></span>
              {/if}
            </button>
          </div>
        {/each}
      </div>

      <!-- Divider -->
      <div class="taskbar-divider"></div>

      <!-- Auth indicator -->
      {#if isAuthenticated}
        <button class="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 text-xs text-slate-300" title="Signed in">
          <div class="w-5 h-5 rounded-full bg-indigo-500/30 flex items-center justify-center">
            <span class="text-[10px] text-indigo-300">{authModel?.name?.[0] || '?'}</span>
          </div>
        </button>
      {:else}
        <button
          class="px-2.5 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-xs text-indigo-300 transition-colors"
          onclick={() => onSignInClick?.()}
        >
          Sign In
        </button>
      {/if}

      <!-- Clock & Date -->
      <button class="clock-area flex flex-col items-center justify-center px-3 py-1 rounded-lg min-w-[72px] min-h-[44px] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none" title="Calendar">
        <span class="text-[11px] font-medium text-white">{timeStr}</span>
        <span class="text-[10px] text-slate-400">{dateStr}</span>
      </button>
    </div>
  </div>
{/if}

<style>
  /* Taskbar Container Animation */
  .taskbar-container {
    animation: taskbar-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes taskbar-appear {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  /* Taskbar Glass Effect */
  .taskbar-glass {
    background: linear-gradient(180deg,
      rgba(30, 41, 59, 0.85) 0%,
      rgba(15, 23, 42, 0.9) 100%
    );
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 2px 8px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  /* Divider */
  .taskbar-divider {
    width: 1px;
    height: 24px;
    background: linear-gradient(180deg,
      transparent 0%,
      rgba(255, 255, 255, 0.15) 20%,
      rgba(255, 255, 255, 0.15) 80%,
      transparent 100%
    );
    margin: 0 4px;
  }

  /* Start Button */
  .start-button {
    background: transparent;
  }

  .start-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .start-button:active {
    background: rgba(255, 255, 255, 0.05);
    transform: scale(0.95);
  }

  /* Taskbar Icon */
  .taskbar-icon {
    background: transparent;
  }

  .taskbar-icon:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .taskbar-icon:active {
    background: rgba(255, 255, 255, 0.05);
    transform: scale(0.95);
  }

  .taskbar-icon-running {
    background: rgba(255, 255, 255, 0.05);
  }

  .taskbar-icon-running:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .taskbar-icon-focused {
    background: rgba(var(--desktop-accent-rgb), 0.2);
  }

  .taskbar-icon-focused:hover {
    background: rgba(var(--desktop-accent-rgb), 0.25);
  }

  /* Running Indicator */
  .running-indicator {
    transition: width 0.2s ease, background-color 0.2s ease;
  }

  .running-indicator.multi-window {
    box-shadow:
      -4px 0 0 rgba(255, 255, 255, 0.5),
      4px 0 0 rgba(255, 255, 255, 0.5);
  }

  /* System Tray Icons */
  .tray-icon {
    transition: background-color 0.15s ease;
  }

  .tray-icon:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Clock Area */
  .clock-area {
    transition: background-color 0.15s ease;
  }

  .clock-area:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Notification Button */
  .notification-btn {
    transition: background-color 0.15s ease;
  }

  .notification-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Preview Popup */
  .preview-popup {
    animation: preview-appear 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .tooltip-popup {
    animation: tooltip-appear 0.15s ease forwards;
  }

  @keyframes preview-appear {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }
  }

  @keyframes tooltip-appear {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  /* Preview Thumbnail */
  .preview-thumbnail:hover {
    transform: scale(1.02);
  }

  .preview-container {
    min-width: 180px;
  }

  /* Mobile Dock Styles */
  .mobile-dock-glass {
    background: linear-gradient(180deg,
      rgba(30, 41, 59, 0.9) 0%,
      rgba(15, 23, 42, 0.95) 100%
    );
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .mobile-dock-icon:active {
    background: rgba(255, 255, 255, 0.08);
  }

  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* Hide scrollbar for taskbar app icons */
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  /* Custom scrollbar for preview */
  .preview-container::-webkit-scrollbar {
    height: 4px;
  }

  .preview-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .preview-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
</style>
