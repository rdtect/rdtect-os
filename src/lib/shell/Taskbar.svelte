<script lang="ts">
  import { onDestroy } from 'svelte';
  import { wm } from './registry.svelte';
  import type { AppDefinition, MenuItem } from './types';
  import type { PluginType } from '$lib/core/types';
  import { Window } from './window.svelte';
  import { getAuthState } from '$lib/core/pocketbase';

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

  // Plugin type badge info
  const pluginBadges: Record<PluginType, { label: string; color: string }> = {
    native: { label: 'Native', color: 'bg-emerald-500' },
    webcomponent: { label: 'Web', color: 'bg-blue-500' },
    wasm: { label: 'WASM', color: 'bg-amber-500' },
    iframe: { label: 'App', color: 'bg-purple-500' },
    federation: { label: 'Cloud', color: 'bg-rose-500' },
  };

  // Get all unique apps (pinned + running)
  const taskbarApps = $derived(() => {
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

<!-- Modern Windows 11 / macOS style Taskbar -->
<div class="taskbar-container fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
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
    <div class="flex items-center gap-1.5 px-1">
      {#each taskbarApps() as app (app.id)}
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

    <!-- System Tray -->
    <div class="flex items-center gap-0.5">
      <!-- Hidden icons indicator (caret) -->
      <button class="tray-icon w-11 h-11 flex items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none" title="Show hidden icons">
        <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      <!-- Network -->
      <button class="tray-icon w-11 h-11 flex items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none" title="Network">
        <svg class="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
        </svg>
      </button>

      <!-- Volume -->
      <button class="tray-icon w-11 h-11 flex items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none" title="Volume">
        <svg class="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      </button>

      <!-- Battery -->
      <button class="tray-icon w-11 h-11 flex items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none" title="Battery: 85%">
        <svg class="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM15 19H9V6h6v13z"/>
        </svg>
      </button>

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
    </div>

    <!-- Clock & Date -->
    <button class="clock-area flex flex-col items-center justify-center px-3 py-1 rounded-lg min-w-[72px] min-h-[44px] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none" title="Calendar">
      <span class="text-[11px] font-medium text-white">{timeStr}</span>
      <span class="text-[10px] text-slate-400">{dateStr}</span>
    </button>

    <!-- Notification Area -->
    <button class="notification-btn w-11 h-11 flex items-center justify-center rounded-lg relative focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none" title="Notifications">
      <svg class="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>
      <!-- Notification dot -->
      <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-desktop-accent"></span>
    </button>
  </div>
</div>

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
    background: rgba(99, 102, 241, 0.2);
  }

  .taskbar-icon-focused:hover {
    background: rgba(99, 102, 241, 0.25);
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
