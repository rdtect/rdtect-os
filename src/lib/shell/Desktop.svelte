<script lang="ts">
  import { wm } from './registry.svelte';
  import Window from './Window.svelte';
  import Taskbar from './Taskbar.svelte';
  import DesktopIcons from './DesktopIcons.svelte';
  import DesktopWidgets from './DesktopWidgets.svelte';
  import ContextMenu from './ContextMenu.svelte';
  import type { MenuItem } from './types';
  import StartMenu from './StartMenu.svelte';
  import AppLauncher from './AppLauncher.svelte';
  import AppInfoModal from './AppInfoModal.svelte';
  import WindowSwitcher from './WindowSwitcher.svelte';
  import { keyboardShortcuts, type Shortcut } from '$lib/core/keyboard-shortcuts';
  import { eventBus } from '$lib/core/event-bus';
  import { widgetRegistry } from '$lib/core/widget-registry.svelte';
  import { onMount } from 'svelte';
  import type { AppDefinition } from './types';

  // Loading screen state - only shows once on initial page load
  let isLoading = $state(true);
  let loadingProgress = $state(0);
  let isFadingOut = $state(false);
  let bootMessageIndex = $state(0);
  let showProfile = $state(false);

  // Boot sequence messages
  const bootMessages = [
    'Initializing kernel...',
    'Loading system modules...',
    'Starting window manager...',
    'Preparing desktop environment...',
    'Almost ready...',
  ];

  // Progress animation, boot messages, and auto-dismiss
  $effect(() => {
    if (!isLoading) return;

    // Animate progress bar with realistic acceleration
    const progressInterval = setInterval(() => {
      loadingProgress = Math.min(loadingProgress + Math.random() * 8 + 3, 100);
    }, 150);

    // Cycle through boot messages
    const messageInterval = setInterval(() => {
      bootMessageIndex = Math.min(bootMessageIndex + 1, bootMessages.length - 1);
    }, 600);

    // Show profile info after a short delay
    const profileTimeout = setTimeout(() => {
      showProfile = true;
    }, 800);

    // Auto-dismiss after 3.5 seconds for the full boot experience
    const dismissTimeout = setTimeout(() => {
      isFadingOut = true;
      // Remove loading screen after fade animation completes
      setTimeout(() => {
        isLoading = false;
      }, 600);
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(profileTimeout);
      clearTimeout(dismissTimeout);
    };
  });

  // Start Menu state (new compact menu)
  let startMenuOpen = $state(false);

  // App Launcher state (legacy fullscreen launcher - keep for Ctrl+Space)
  let launcherOpen = $state(false);

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

  function openStartMenu() {
    startMenuOpen = true;
  }

  function closeStartMenu() {
    startMenuOpen = false;
  }

  function openLauncher() {
    launcherOpen = true;
  }

  function closeLauncher() {
    launcherOpen = false;
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

  // Close all overlays (context menu, launcher, modals)
  function closeAllOverlays() {
    contextMenu.show = false;
    startMenuOpen = false;
    launcherOpen = false;
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
      // Launcher toggle
      {
        key: 'Space',
        ctrl: true,
        action: () => { launcherOpen = !launcherOpen; },
        description: 'Toggle App Launcher',
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
        { label: 'Open', icon: '📂', action: () => wm.openWindow(app.id) },
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
  <!-- Premium animated background with multiple layers -->
  <div class="absolute inset-0 bg-desktop-gradient">
    <!-- Aurora animated glow effect -->
    <div class="bg-desktop-aurora"></div>
    <!-- Radial gradient overlays -->
    <div class="absolute inset-0 bg-desktop-overlay"></div>
    <!-- Subtle grid pattern -->
    <div class="absolute inset-0 bg-desktop-grid"></div>
    <!-- Noise texture for depth -->
    <div class="absolute inset-0 bg-desktop-noise"></div>

    <!-- rdtect Branding Watermark -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <!-- Large rd monogram watermark - bottom right -->
      <div class="absolute -bottom-20 -right-20 w-[500px] h-[500px] opacity-[0.03] select-none">
        <svg viewBox="0 0 200 200" class="w-full h-full animate-float-slow">
          <defs>
            <linearGradient id="rdGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#6366f1"/>
              <stop offset="100%" style="stop-color:#8b5cf6"/>
            </linearGradient>
          </defs>
          <rect x="20" y="20" width="160" height="160" rx="32" fill="url(#rdGradient)"/>
          <text x="100" y="130" text-anchor="middle" font-size="90" font-weight="900" fill="white" font-family="system-ui, -apple-system, sans-serif">rd</text>
        </svg>
      </div>

      <!-- Floating geometric shapes -->
      <div class="absolute top-[10%] left-[5%] w-32 h-32 opacity-[0.04]">
        <svg viewBox="0 0 100 100" class="w-full h-full animate-float-drift">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" stroke-width="2"/>
          <circle cx="50" cy="50" r="25" fill="none" stroke="#8b5cf6" stroke-width="1.5"/>
        </svg>
      </div>

      <div class="absolute top-[60%] left-[8%] w-24 h-24 opacity-[0.03]">
        <svg viewBox="0 0 100 100" class="w-full h-full animate-float-reverse">
          <polygon points="50,10 90,90 10,90" fill="none" stroke="#a855f7" stroke-width="2"/>
        </svg>
      </div>

      <div class="absolute top-[25%] right-[12%] w-20 h-20 opacity-[0.04]">
        <svg viewBox="0 0 100 100" class="w-full h-full animate-spin-very-slow">
          <rect x="20" y="20" width="60" height="60" rx="8" fill="none" stroke="#6366f1" stroke-width="2" transform="rotate(45 50 50)"/>
        </svg>
      </div>

      <div class="absolute bottom-[30%] right-[5%] w-16 h-16 opacity-[0.03]">
        <svg viewBox="0 0 100 100" class="w-full h-full animate-float">
          <path d="M50 10 L90 50 L50 90 L10 50 Z" fill="none" stroke="#8b5cf6" stroke-width="2"/>
        </svg>
      </div>

      <!-- Subtle brand text watermarks -->
      <div class="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 opacity-[0.015] select-none">
        <span class="text-[180px] font-black tracking-tighter text-white whitespace-nowrap" style="font-family: system-ui, -apple-system, sans-serif;">
          rdtect
        </span>
      </div>

      <!-- Particle dots -->
      <div class="particles-container">
        <div class="particle particle-1"></div>
        <div class="particle particle-2"></div>
        <div class="particle particle-3"></div>
        <div class="particle particle-4"></div>
        <div class="particle particle-5"></div>
      </div>
    </div>
  </div>

  <!-- Desktop area with icons and widgets -->
  <div class="absolute inset-0 bottom-14">
    <!-- Desktop Icons (top-left area) -->
    <DesktopIcons bind:this={desktopIconsRef} onContextMenu={showAppContextMenu} />

    <!-- Desktop Widgets (clock, system tray - top-right) -->
    <DesktopWidgets />

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
        <div class="absolute inset-2 rounded-xl bg-indigo-500/30 border-2 border-indigo-500/50 backdrop-blur-sm animate-snap-preview">
          <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-400/20 to-purple-500/20"></div>
        </div>
      </div>
    {/if}

    <!-- Loading screen - shows once on initial page load -->
    {#if isLoading}
      <div
        class="absolute inset-0 flex items-center justify-center z-50 transition-opacity duration-600"
        class:opacity-0={isFadingOut}
        class:pointer-events-none={isFadingOut}
        style="background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%);"
      >
        <div class="text-center p-10 glass-panel rounded-3xl max-w-lg mx-4 relative overflow-hidden">
          <!-- Shimmer effect overlay -->
          <div class="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>

          <!-- Logo with orbiting dots and pulse -->
          <div class="flex flex-col items-center justify-center mb-6">
            <!-- rd Monogram Logo -->
            <div class="relative w-24 h-24 flex items-center justify-center mb-4">
              <!-- Pulsing glow background -->
              <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-desktop-accent/30 to-purple-500/30 animate-pulse-glow blur-xl"></div>

              <!-- Orbiting dots container -->
              <div class="absolute inset-[-8px] animate-spin-slow">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-desktop-accent shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div>
              </div>
              <div class="absolute inset-[-16px] animate-spin-reverse">
                <div class="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>
                <div class="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
              </div>
              <div class="absolute inset-[-24px] animate-spin-slower">
                <div class="absolute top-[15%] right-[15%] w-1 h-1 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]"></div>
                <div class="absolute bottom-[15%] left-[15%] w-1 h-1 rounded-full bg-indigo-300 shadow-[0_0_6px_rgba(165,180,252,0.8)]"></div>
              </div>

              <!-- rd Monogram -->
              <div class="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-desktop-accent via-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] animate-logo-pulse">
                <span class="text-3xl font-black text-white tracking-tighter" style="font-family: system-ui, -apple-system, sans-serif;">rd</span>
              </div>
            </div>

            <!-- Brand Name -->
            <div class="text-center">
              <h1 class="text-4xl font-bold m-0 animate-text-glow">
                <span class="bg-gradient-to-r from-desktop-accent via-indigo-400 to-purple-400 bg-clip-text text-transparent">rdtect</span>
                <span class="text-slate-300 font-light ml-1">OS</span>
              </h1>
              <p class="text-slate-400 text-sm mt-2 tracking-wide">Web-Native Desktop Experience</p>
              <p class="text-slate-600 text-xs mt-1 font-mono">v1.0.0</p>
            </div>
          </div>

          <!-- Profile info with fade-in -->
          <div class="transition-all duration-500 {showProfile ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}">
            <!-- Author Info -->
            <p class="text-slate-400 text-sm mb-2">A portfolio project by</p>
            <div class="flex items-center justify-center gap-2 mb-4">
              <span class="text-desktop-accent font-semibold text-lg">rdtect</span>
              <span class="text-slate-500">|</span>
              <span class="text-slate-400 text-sm">UI/UX & Frontend Developer</span>
            </div>

            <!-- Social Links -->
            <div class="flex items-center justify-center gap-3 mb-6">
              <a href="https://github.com/rdtect" target="_blank" rel="noopener" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white text-xs transition-all hover:scale-105">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
              <a href="https://x.com/rdtect" target="_blank" rel="noopener" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white text-xs transition-all hover:scale-105">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                @rdtect
              </a>
              <a href="https://rdtect.com" target="_blank" rel="noopener" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white text-xs transition-all hover:scale-105">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>
                Website
              </a>
            </div>

            <!-- Tech Stack Badges -->
            <div class="flex gap-2 justify-center mb-6 flex-wrap">
              <span class="px-3 py-1 bg-desktop-accent/10 rounded-full text-indigo-200 text-xs border border-desktop-accent/20 hover:bg-desktop-accent/20 transition-colors">Svelte 5</span>
              <span class="px-3 py-1 bg-desktop-accent/10 rounded-full text-indigo-200 text-xs border border-desktop-accent/20 hover:bg-desktop-accent/20 transition-colors">TypeScript</span>
              <span class="px-3 py-1 bg-desktop-accent/10 rounded-full text-indigo-200 text-xs border border-desktop-accent/20 hover:bg-desktop-accent/20 transition-colors">Bun</span>
              <span class="px-3 py-1 bg-desktop-accent/10 rounded-full text-indigo-200 text-xs border border-desktop-accent/20 hover:bg-desktop-accent/20 transition-colors">5 Plugin Types</span>
            </div>
          </div>

          <!-- Enhanced progress bar with gradient and glow -->
          <div class="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden mb-3 relative">
            <!-- Glow effect -->
            <div
              class="absolute inset-y-0 left-0 bg-gradient-to-r from-desktop-accent via-indigo-400 to-cyan-400 rounded-full blur-sm opacity-60"
              style="width: {loadingProgress}%"
            ></div>
            <!-- Main bar -->
            <div
              class="h-full bg-gradient-to-r from-desktop-accent via-indigo-400 to-cyan-400 rounded-full transition-all duration-150 ease-out relative"
              style="width: {loadingProgress}%"
            >
              <!-- Shimmer on progress bar -->
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-progress-shimmer"></div>
            </div>
          </div>

          <!-- Boot message with typewriter effect -->
          <div class="h-5 flex items-center justify-center">
            <p class="text-slate-400 text-xs m-0 font-mono flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              {bootMessages[bootMessageIndex]}
            </p>
          </div>

          <!-- Progress percentage -->
          <p class="text-slate-600 text-[10px] mt-2 font-mono">{Math.round(loadingProgress)}%</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Taskbar -->
  <Taskbar
    onOpenLauncher={openStartMenu}
    onContextMenu={showGenericContextMenu}
    onShowAppInfo={showAppInfo}
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

  <!-- App Launcher (legacy fullscreen - accessed via Ctrl+Space) -->
  <AppLauncher bind:open={launcherOpen} onClose={closeLauncher} />

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
</div>
