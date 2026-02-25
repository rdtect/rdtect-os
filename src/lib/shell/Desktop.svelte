<script lang="ts">
  import { wm } from './registry.svelte';
  import Window from './Window.svelte';
  import Taskbar from './Taskbar.svelte';
  import DesktopIcons from './DesktopIcons.svelte';
  import DesktopWidgets from './DesktopWidgets.svelte';
  import ContextMenu from './ContextMenu.svelte';
  import type { MenuItem } from './types';
  import StartMenu from './StartMenu.svelte';
  import AppInfoModal from './AppInfoModal.svelte';
  import WindowSwitcher from './WindowSwitcher.svelte';
  import AuthGate from './AuthGate.svelte';
  import { keyboardShortcuts, type Shortcut } from '$lib/core/keyboard-shortcuts';
  import { eventBus } from '$lib/core/event-bus';
  import { widgetRegistry } from '$lib/core/widget-registry.svelte';
  import { getAuthState } from '$lib/core/pocketbase';
  import { mobile } from '$lib/core/mobile.svelte';
  import { onMount } from 'svelte';
  import type { AppDefinition } from './types';

  // Loading screen state - only shows once on initial page load
  let isLoading = $state(true);
  let loadingProgress = $state(0);
  let isFadingOut = $state(false);
  let bootMessageIndex = $state(0);
  // Boot sequence messages
  const bootMessages = [
    'Initializing...',
    'Loading...',
    'Ready',
  ];

  // Progress animation and auto-dismiss (max 800ms total)
  $effect(() => {
    if (!isLoading) return;

    const progressInterval = setInterval(() => {
      loadingProgress = Math.min(loadingProgress + Math.random() * 15 + 8, 100);
    }, 80);

    const messageInterval = setInterval(() => {
      bootMessageIndex = Math.min(bootMessageIndex + 1, bootMessages.length - 1);
    }, 200);

    // Auto-dismiss after 500ms, fade 300ms = 800ms total
    const dismissTimeout = setTimeout(() => {
      isFadingOut = true;
      setTimeout(() => {
        isLoading = false;
      }, 300);
    }, 500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(dismissTimeout);
    };
  });

  // Start Menu state
  let startMenuOpen = $state(false);

  // Window Switcher state (Alt+Tab)
  let windowSwitcherOpen = $state(false);
  let windowSwitcherIndex = $state(0);
  let altKeyHeld = $state(false);

  // Desktop Icons reference for managing hidden icons and positions
  let desktopIconsRef: {
    hideIcon: (appId: string) => void;
    showIcon: (appId: string) => void;
    showAllIcons: () => void;
    getHiddenIcons: () => AppDefinition[];
    hasHiddenIcons: () => boolean;
    resetIconPositions: () => void;
    hasCustomPositions: () => boolean;
  };

  // Auth gate state
  let showAuthGate = $state(false);
  let pendingPluginId = $state<string | null>(null);
  let isAuthenticated = $derived(getAuthState().isValid);

  /**
   * Launch an app with auth check. If the app is protected and the user
   * is not authenticated, show the auth gate instead of opening the window.
   */
  function launchApp(appId: string) {
    const app = wm.getApp(appId);
    if (app?.plugin?.manifest?.access === 'protected' && !isAuthenticated) {
      pendingPluginId = appId;
      showAuthGate = true;
      return;
    }
    wm.openWindow(appId);
  }

  function openStartMenu() {
    startMenuOpen = true;
  }

  function closeStartMenu() {
    startMenuOpen = false;
  }

  // Window Switcher functions
  function openWindowSwitcher() {
    if (wm.windows.length === 0) return;
    windowSwitcherOpen = true;
    windowSwitcherIndex = 0;
  }

  function cycleWindowSwitcher(reverse: boolean = false) {
    if (!windowSwitcherOpen || wm.windows.length === 0) return;

    if (reverse) {
      windowSwitcherIndex = (windowSwitcherIndex - 1 + wm.windows.length) % wm.windows.length;
    } else {
      windowSwitcherIndex = (windowSwitcherIndex + 1) % wm.windows.length;
    }
  }

  function closeWindowSwitcher() {
    if (windowSwitcherOpen && wm.windows.length > 0) {
      const selectedWindow = wm.windows[windowSwitcherIndex];
      if (selectedWindow) {
        wm.focusWindow(selectedWindow.id);
      }
    }
    windowSwitcherOpen = false;
    windowSwitcherIndex = 0;
  }

  function selectWindowFromSwitcher(windowId: string) {
    wm.focusWindow(windowId);
    windowSwitcherOpen = false;
    windowSwitcherIndex = 0;
  }

  // Close all overlays (context menu, modals)
  function closeAllOverlays() {
    contextMenu.show = false;
    startMenuOpen = false;
    appInfoModal.show = false;
  }

  // Handle global keyboard events (for Alt key tracking)
  function handleKeydown(e: KeyboardEvent) {
    // Track Alt key state for window switcher
    if (e.key === 'Alt') {
      altKeyHeld = true;
    }

    // Alt+Tab window cycling
    if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
      if (!windowSwitcherOpen) {
        openWindowSwitcher();
      } else {
        cycleWindowSwitcher(e.shiftKey);
      }
    }
  }

  function handleKeyup(e: KeyboardEvent) {
    // Release Alt key closes window switcher and focuses selected window
    if (e.key === 'Alt') {
      altKeyHeld = false;
      if (windowSwitcherOpen) {
        closeWindowSwitcher();
      }
    }
  }

  // Register keyboard shortcuts on mount
  onMount(() => {
    const shortcuts: Shortcut[] = [
      // Start Menu toggle
      {
        key: 'Space',
        ctrl: true,
        action: () => { startMenuOpen = !startMenuOpen; },
        description: 'Toggle Start Menu',
        category: 'General',
      },
      // Close focused window
      {
        key: 'F4',
        alt: true,
        action: () => {
          const focused = wm.getFocusedWindow();
          if (focused) wm.closeWindow(focused.id);
        },
        description: 'Close focused window',
        category: 'Windows',
      },
      // Show desktop (minimize all)
      {
        key: 'KeyD',
        meta: true,
        action: () => wm.toggleShowDesktop(),
        description: 'Show desktop (minimize all)',
        category: 'Windows',
      },
      // Minimize focused window
      {
        key: 'KeyM',
        meta: true,
        action: () => {
          const focused = wm.getFocusedWindow();
          if (focused) wm.minimizeWindow(focused.id);
        },
        description: 'Minimize focused window',
        category: 'Windows',
      },
      // Maximize focused window (Super+Up)
      {
        key: 'ArrowUp',
        meta: true,
        action: () => {
          const focused = wm.getFocusedWindow();
          if (focused) wm.snapWindow(focused.id, 'maximize');
        },
        description: 'Maximize focused window',
        category: 'Windows',
      },
      // Snap window left (Super+Left)
      {
        key: 'ArrowLeft',
        meta: true,
        action: () => {
          const focused = wm.getFocusedWindow();
          if (focused) wm.snapWindow(focused.id, 'left');
        },
        description: 'Snap window to left half',
        category: 'Windows',
      },
      // Snap window right (Super+Right)
      {
        key: 'ArrowRight',
        meta: true,
        action: () => {
          const focused = wm.getFocusedWindow();
          if (focused) wm.snapWindow(focused.id, 'right');
        },
        description: 'Snap window to right half',
        category: 'Windows',
      },
      // Escape to close overlays
      {
        key: 'Escape',
        action: closeAllOverlays,
        description: 'Close menus and modals',
        category: 'General',
      },
    ];

    const cleanup = keyboardShortcuts.registerMany(shortcuts);

    return () => {
      cleanup();
    };
  });

  // Context menu state
  let contextMenu = $state<{
    show: boolean;
    x: number;
    y: number;
    items: MenuItem[];
  }>({
    show: false,
    x: 0,
    y: 0,
    items: [],
  });

  // Desktop view state (for View submenu)
  let desktopViewSize = $state<'large' | 'medium' | 'small'>('medium');

  // Desktop sort state (for Sort by submenu)
  let desktopSortBy = $state<'name' | 'date' | 'type'>('name');

  // Taskbar lock state
  let taskbarLocked = $state(false);

  // Taskbar visibility state
  let taskbarShowSearch = $state(true);
  let taskbarShowWidgets = $state(true);
  let taskbarShowTaskView = $state(true);

  // App Info Modal state
  let appInfoModal = $state<{
    show: boolean;
    app: AppDefinition | null;
    view: 'source' | 'architecture' | 'docs';
  }>({
    show: false,
    app: null,
    view: 'source',
  });

  function showAppInfo(app: AppDefinition, view: 'source' | 'architecture' | 'docs') {
    appInfoModal = {
      show: true,
      app,
      view,
    };
  }

  function closeAppInfoModal() {
    appInfoModal.show = false;
  }

  function showAppContextMenu(e: MouseEvent, app: AppDefinition) {
    contextMenu = {
      show: true,
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: 'Open', icon: '📂', action: () => launchApp(app.id) },
        { separator: true, label: '' },
        { label: 'View Source Code', icon: '< >', action: () => showAppInfo(app, 'source') },
        { label: 'View Architecture', icon: '🔧', action: () => showAppInfo(app, 'architecture') },
        { label: 'View Docs', icon: '📖', action: () => showAppInfo(app, 'docs') },
        { separator: true, label: '' },
        {
          label: 'Remove from Desktop',
          icon: '🗑️',
          action: () => desktopIconsRef?.hideIcon(app.id),
        },
      ],
    };
  }

  function showDesktopContextMenu(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.icon')) return;
    if ((e.target as HTMLElement).closest('.glass-panel')) return;

    e.preventDefault();

    // Emit desktop context menu event
    eventBus.emit('desktop:contextmenu', { x: e.clientX, y: e.clientY });

    // Check if there are hidden icons
    const hasHidden = desktopIconsRef?.hasHiddenIcons() ?? false;
    const hiddenIcons = hasHidden ? desktopIconsRef?.getHiddenIcons() ?? [] : [];

    // Check if there are custom icon positions
    const hasCustomPositions = desktopIconsRef?.hasCustomPositions() ?? false;

    // Build "New" submenu
    const newSubmenu: MenuItem[] = [
      {
        label: 'Folder',
        icon: '📁',
        action: () => { /* Placeholder - folder creation not implemented */ },
      },
      {
        label: 'Text File',
        icon: '📄',
        action: () => { /* Placeholder - text file creation not implemented */ },
      },
      {
        label: 'Note',
        icon: '📝',
        action: () => wm.openWindow('notes'),
      },
    ];

    // Build "View" submenu
    const viewSubmenu: MenuItem[] = [
      {
        label: 'Large Icons',
        checked: desktopViewSize === 'large',
        action: () => { desktopViewSize = 'large'; },
      },
      {
        label: 'Medium Icons',
        checked: desktopViewSize === 'medium',
        action: () => { desktopViewSize = 'medium'; },
      },
      {
        label: 'Small Icons',
        checked: desktopViewSize === 'small',
        action: () => { desktopViewSize = 'small'; },
      },
    ];

    // Build "Sort by" submenu
    const sortBySubmenu: MenuItem[] = [
      {
        label: 'Name',
        checked: desktopSortBy === 'name',
        action: () => { desktopSortBy = 'name'; },
      },
      {
        label: 'Date',
        checked: desktopSortBy === 'date',
        action: () => { desktopSortBy = 'date'; },
      },
      {
        label: 'Type',
        checked: desktopSortBy === 'type',
        action: () => { desktopSortBy = 'type'; },
      },
    ];

    // Build Widgets submenu
    const availableWidgets = widgetRegistry.availableWidgets;
    const widgetsSubmenu: MenuItem[] = [];

    if (availableWidgets.length > 0) {
      // Add individual widget toggle options
      for (const widget of availableWidgets) {
        widgetsSubmenu.push({
          label: widget.name,
          icon: widget.icon || '🔲',
          checked: widget.visible,
          action: () => widgetRegistry.toggleByPlugin(widget.pluginId),
        });
      }

      widgetsSubmenu.push({ separator: true, label: '' });

      // Add show/hide all options
      widgetsSubmenu.push({
        label: 'Show All',
        icon: '👁️',
        action: () => widgetRegistry.showAll(),
      });
      widgetsSubmenu.push({
        label: 'Hide All',
        icon: '🙈',
        action: () => widgetRegistry.hideAll(),
      });

      widgetsSubmenu.push({ separator: true, label: '' });
      widgetsSubmenu.push({
        label: 'Reset Positions',
        icon: '↩️',
        action: () => widgetRegistry.resetPositions(),
      });
    } else {
      widgetsSubmenu.push({
        label: 'No widgets available',
        disabled: true,
      });
    }

    // Build main menu items
    const menuItems: MenuItem[] = [
      {
        label: 'New',
        icon: '➕',
        submenu: newSubmenu,
      },
      {
        label: 'View',
        icon: '👁️',
        submenu: viewSubmenu,
      },
      {
        label: 'Sort by',
        icon: '📊',
        submenu: sortBySubmenu,
      },
      { separator: true, label: '' },
      {
        label: 'Refresh',
        icon: '🔄',
        action: () => { eventBus.emit('desktop:refresh'); window.location.reload(); },
      },
      {
        label: 'Change Wallpaper',
        icon: '🖼️',
        action: () => { /* Placeholder - wallpaper settings not implemented */ },
        disabled: true,
      },
      { separator: true, label: '' },
      {
        label: 'Widgets',
        icon: '🔲',
        submenu: widgetsSubmenu,
      },
    ];

    // Add "Show all icons" section if there are hidden icons
    if (hasHidden) {
      menuItems.push({ separator: true, label: '' });
      menuItems.push({
        label: `Show All Desktop Icons (${hiddenIcons.length})`,
        icon: '👁️',
        action: () => desktopIconsRef?.showAllIcons(),
      });
    }

    // Add "Reset Icon Positions" option if icons have been moved
    if (hasCustomPositions) {
      menuItems.push({
        label: 'Reset Icon Positions',
        icon: '↩️',
        action: () => desktopIconsRef?.resetIconPositions(),
      });
    }

    menuItems.push({ separator: true, label: '' });
    menuItems.push({
      label: 'Display Settings',
      icon: '🖥️',
      action: () => { /* Placeholder - display settings not implemented */ },
      disabled: true,
    });
    menuItems.push({
      label: 'About rdtect OS',
      icon: '💻',
      action: () => wm.openWindow('about'),
    });

    contextMenu = {
      show: true,
      x: e.clientX,
      y: e.clientY,
      items: menuItems,
    };
  }

  function closeContextMenu() {
    contextMenu.show = false;
  }

  // Generic context menu handler for components
  function showGenericContextMenu(e: MouseEvent, items: typeof contextMenu.items) {
    contextMenu = {
      show: true,
      x: e.clientX,
      y: e.clientY,
      items,
    };
  }
</script>

<svelte:window onkeydown={handleKeydown} onkeyup={handleKeyup} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 overflow-hidden font-sans" oncontextmenu={showDesktopContextMenu}>
  <!-- Desktop background: 3 layers (gradient, aurora, noise) -->
  <div class="absolute inset-0 bg-desktop-gradient">
    <!-- Layer 1: Base gradient (via bg-desktop-gradient class) -->
    <!-- Layer 2: Aurora glow effect -->
    <div class="bg-desktop-aurora"></div>
    <div class="absolute inset-0 bg-desktop-overlay"></div>
    <!-- Layer 3: Noise texture for depth -->
    <div class="absolute inset-0 bg-desktop-noise"></div>
  </div>

  <!-- Desktop area with icons and widgets -->
  <div class="absolute inset-0 {mobile.isMobile ? 'bottom-20' : 'bottom-14'}">
    <!-- Desktop Icons (top-left on desktop, grid on mobile) -->
    <DesktopIcons bind:this={desktopIconsRef} onContextMenu={showAppContextMenu} />

    <!-- Desktop Widgets (hidden on mobile) -->
    {#if !mobile.isMobile}
      <DesktopWidgets />
    {/if}

    <!-- Windows Layer -->
    <div class="absolute inset-0 pointer-events-none">
      {#each wm.visibleWindows as win (win.id)}
        <div class="pointer-events-auto">
          <Window {win} onContextMenu={showGenericContextMenu} />
        </div>
      {/each}
    </div>

    <!-- Snap Preview Overlay -->
    {#if wm.snapPreview.bounds}
      <div
        class="absolute pointer-events-none z-[9999] snap-preview"
        style="
          left: {wm.snapPreview.bounds.x}px;
          top: {wm.snapPreview.bounds.y}px;
          width: {wm.snapPreview.bounds.width}px;
          height: {wm.snapPreview.bounds.height}px;
        "
      >
        <div class="absolute inset-2 rounded-xl bg-desktop-accent/30 border-2 border-desktop-accent/50 backdrop-blur-sm animate-snap-preview">
          <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-desktop-accent/20 to-purple-500/20"></div>
        </div>
      </div>
    {/if}

    <!-- Loading screen - shows once on initial page load -->
    {#if isLoading}
      <div
        class="absolute inset-0 flex items-center justify-center z-50 transition-opacity duration-300"
        class:opacity-0={isFadingOut}
        class:pointer-events-none={isFadingOut}
        style="background: rgba(15, 23, 42, 0.95);"
      >
        <div class="text-center max-w-sm mx-4">
          <!-- rd Monogram -->
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-desktop-accent via-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
            <span class="text-3xl font-black text-white tracking-tighter" style="font-family: system-ui, -apple-system, sans-serif;">rd</span>
          </div>

          <!-- Progress bar -->
          <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              class="h-full bg-desktop-accent rounded-full transition-all duration-150 ease-out"
              style="width: {loadingProgress}%"
            ></div>
          </div>

          <!-- Status line -->
          <p class="text-slate-500 text-xs font-mono">{bootMessages[bootMessageIndex]}</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Taskbar -->
  <Taskbar
    onOpenLauncher={openStartMenu}
    onContextMenu={showGenericContextMenu}
    onShowAppInfo={showAppInfo}
    onSignInClick={() => { showAuthGate = true; }}
    onLaunchApp={launchApp}
  />

  <!-- Start Menu (Windows 11 style) -->
  <StartMenu bind:open={startMenuOpen} onClose={closeStartMenu} />

  <!-- Context Menu -->
  {#if contextMenu.show}
    <ContextMenu
      items={contextMenu.items}
      x={contextMenu.x}
      y={contextMenu.y}
      onClose={closeContextMenu}
    />
  {/if}

  <!-- App Info Modal -->
  {#if appInfoModal.show && appInfoModal.app}
    <AppInfoModal
      app={appInfoModal.app}
      view={appInfoModal.view}
      onClose={closeAppInfoModal}
    />
  {/if}

  <!-- Window Switcher (Alt+Tab) -->
  <WindowSwitcher
    open={windowSwitcherOpen}
    selectedIndex={windowSwitcherIndex}
    onSelect={selectWindowFromSwitcher}
    onClose={() => { windowSwitcherOpen = false; }}
  />

  <!-- Auth Gate Modal -->
  {#if showAuthGate}
    <AuthGate
      onSuccess={() => {
        showAuthGate = false;
        if (pendingPluginId) {
          wm.openWindow(pendingPluginId);
          pendingPluginId = null;
        }
      }}
      onDismiss={() => {
        showAuthGate = false;
        pendingPluginId = null;
      }}
    />
  {/if}
</div>
