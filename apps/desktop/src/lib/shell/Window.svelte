<script lang="ts">
  import { wm, detectSnapZone } from './registry.svelte';
  import type { WindowState, SnapZone } from './types';
  import { onMount } from 'svelte';
  import {
    draggable,
    resizable,
    doubleClick,
    type ResizeDirection
  } from '$lib/core/attachments';
  import FederationOffline from './FederationOffline.svelte';
  import { mobile } from '$lib/core/mobile.svelte';

  // Track current snap zone during drag
  let currentSnapZone = $state<SnapZone>(null);

  // Context menu item type
  interface ContextMenuItem {
    label: string;
    icon?: string;
    action?: () => void;
    disabled?: boolean;
    separator?: boolean;
  }

  interface Props {
    win: WindowState;
    onContextMenu?: (e: MouseEvent, items: ContextMenuItem[]) => void;
  }

  let { win, onContextMenu }: Props = $props();

  // Always on top state (local to window for now)
  let alwaysOnTop = $state(false);

  // Animation states
  let windowState = $state<'opening' | 'open' | 'closing' | 'minimizing' | 'maximizing' | 'restoring'>('opening');
  let windowElement = $state<HTMLDivElement | null>(null);

  const app = $derived(wm.getApp(win.appId));

  // Determine render mode based on plugin type
  const renderMode = $derived.by(() => {
    if (!app) return null;

    // Check LoadedPlugin render kind first
    if (app.plugin?.render) {
      return app.plugin.render;
    }

    // Legacy fallback for direct component/iframe registration
    if (app.type === 'iframe' && app.url) {
      return { kind: 'iframe' as const, url: app.url };
    }
    if (app.type === 'component' && app.component) {
      return { kind: 'component' as const, component: app.component, props: app.props };
    }

    return null;
  });

  onMount(() => {
    // Transition from opening to open after animation completes
    const timer = setTimeout(() => {
      windowState = 'open';
    }, 250);

    return () => clearTimeout(timer);
  });

  // Draggable attachment for title bar with snap zone detection
  const titleBarDraggable = $derived(
    draggable({
      disabled: win.isMaximized || mobile.isMobile,
      onStart: () => {
        wm.focusWindow(win.id);
        // If window is snapped, unsnap it when starting to drag
        if (win.isSnapped) {
          wm.unsnapWindow(win.id);
        }
      },
      onMove: (e, delta) => {
        wm.moveWindow(win.id, win.x + delta.x, win.y + delta.y);

        // Detect snap zone based on mouse position
        const zone = detectSnapZone(e.clientX, e.clientY);
        if (zone !== currentSnapZone) {
          currentSnapZone = zone;
          wm.showSnapPreview(zone);
        }
      },
      onEnd: (e) => {
        // Apply snap if in a snap zone
        if (currentSnapZone) {
          wm.snapWindow(win.id, currentSnapZone);
          currentSnapZone = null;
        }
        wm.hideSnapPreview();
      }
    })
  );

  // Double-click attachment for title bar maximize toggle
  const titleBarDoubleClick = $derived(
    doubleClick({
      onDoubleClick: () => {
        if (win.isMaximized) {
          windowState = 'restoring';
          setTimeout(() => {
            wm.maximizeWindow(win.id);
            windowState = 'open';
          }, 200);
        } else {
          windowState = 'maximizing';
          setTimeout(() => {
            wm.maximizeWindow(win.id);
            windowState = 'open';
          }, 200);
        }
      }
    })
  );

  // Factory for resize handle attachments
  function createResizeAttachment(direction: ResizeDirection) {
    return resizable({
      direction,
      disabled: win.isMaximized || app?.resizable === false,
      onStart: () => {
        wm.setResizing(win.id, true);
        wm.focusWindow(win.id);
      },
      onMove: (_e, delta) => {
        let newWidth = win.width + delta.width;
        let newHeight = win.height + delta.height;
        let newX = win.x + delta.x;
        let newY = win.y + delta.y;

        // Apply minimum constraints
        if (newWidth >= win.minWidth) {
          wm.resizeWindow(win.id, newWidth, win.height);
          if (direction.includes('w')) wm.moveWindow(win.id, newX, win.y);
        }
        if (newHeight >= win.minHeight) {
          wm.resizeWindow(win.id, win.width, newHeight);
          if (direction.includes('n')) wm.moveWindow(win.id, win.x, newY);
        }
      },
      onEnd: () => {
        wm.setResizing(win.id, false);
      }
    });
  }

  function onWindowClick() {
    wm.focusWindow(win.id);
  }

  function handleMinimize() {
    windowState = 'minimizing';
    setTimeout(() => {
      wm.minimizeWindow(win.id);
      windowState = 'open';
    }, 200);
  }

  function handleMaximize() {
    if (win.isMaximized) {
      windowState = 'restoring';
      setTimeout(() => {
        wm.maximizeWindow(win.id);
        windowState = 'open';
      }, 200);
    } else {
      windowState = 'maximizing';
      setTimeout(() => {
        wm.maximizeWindow(win.id);
        windowState = 'open';
      }, 200);
    }
  }

  function handleClose() {
    windowState = 'closing';
    setTimeout(() => {
      wm.closeWindow(win.id);
    }, 200);
  }

  // Toggle always on top (brings window to very high z-index)
  function toggleAlwaysOnTop() {
    alwaysOnTop = !alwaysOnTop;
    if (alwaysOnTop) {
      // Set a very high z-index to keep on top
      wm.focusWindow(win.id);
    }
  }

  // Handle right-click context menu for title bar
  function handleTitleBarContextMenu(e: MouseEvent) {
    // Don't show context menu if clicking on traffic light buttons
    const target = e.target as HTMLElement;
    if (target.closest('.traffic-light') || target.closest('.traffic-lights')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const items: ContextMenuItem[] = [
      {
        label: 'Minimize',
        icon: '➖',
        action: handleMinimize,
      },
      {
        label: win.isMaximized ? 'Restore' : 'Maximize',
        icon: win.isMaximized ? '🔲' : '🔳',
        action: handleMaximize,
      },
      {
        label: 'Close',
        icon: '✕',
        action: handleClose,
      },
      { separator: true, label: '' },
      {
        label: 'Always on Top',
        icon: alwaysOnTop ? '✓' : '📌',
        action: toggleAlwaysOnTop,
      },
      {
        label: 'Move to...',
        icon: '↗️',
        disabled: true,
      },
    ];

    onContextMenu?.(e, items);
  }

  // Compute animation class based on state
  const animationClass = $derived.by(() => {
    switch (windowState) {
      case 'opening': return 'animate-window-open';
      case 'closing': return 'animate-window-close';
      case 'minimizing': return 'animate-window-minimize';
      case 'maximizing': return 'animate-window-maximize';
      case 'restoring': return 'animate-window-restore';
      default: return '';
    }
  });

  // Shadow intensity based on focus state
  const shadowClass = $derived.by(() => {
    if (win.isFocused) {
      return 'shadow-window-focused';
    }
    return 'shadow-window-unfocused';
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={windowElement}
  class="absolute flex flex-col overflow-hidden transition-shadow duration-200 ease-out window-chrome
    {win.isFocused ? 'window-focused' : 'window-unfocused'}
    {win.isMaximized || mobile.isMobile ? 'rounded-none' : ''}
    {win.isResizing ? 'select-none [&_iframe]:pointer-events-none' : ''}
    {animationClass}
    {shadowClass}"
  style:left={mobile.isMobile ? '0px' : `${win.x}px`}
  style:top={mobile.isMobile ? '0px' : `${win.y}px`}
  style:width={mobile.isMobile ? '100vw' : `${win.width}px`}
  style:height={mobile.isMobile ? '100vh' : `${win.height}px`}
  style:z-index={win.zIndex}
  style:border-radius={win.isMaximized || mobile.isMobile ? '0' : 'var(--radius-lg)'}
  onclick={onWindowClick}
>
  <!-- Title Bar with Glass Effect - Using Svelte 5 Attachments -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="flex items-center h-10 px-3 titlebar-glass border-b border-white/5 select-none shrink-0
      {mobile.isMobile ? '' : 'cursor-grab active:cursor-grabbing'}
      {win.isFocused ? 'titlebar-focused' : 'titlebar-unfocused'}"
    {@attach titleBarDraggable}
    {@attach titleBarDoubleClick}
    oncontextmenu={handleTitleBarContextMenu}
  >
    {#if mobile.isMobile}
      <!-- Mobile: Back button + centered title -->
      <button
        class="flex items-center gap-1 px-2 py-1 -ml-1 rounded-lg text-desktop-accent active:bg-white/10 min-w-[44px] min-h-[44px]"
        onclick={handleClose}
        aria-label="Close"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M15 19l-7-7 7-7"/>
        </svg>
        <span class="text-sm">Back</span>
      </button>
      <div class="flex-1 flex items-center justify-center gap-2 min-w-0">
        <span class="text-sm shrink-0">{app?.icon}</span>
        <span class="text-[13px] font-semibold text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">{win.title}</span>
      </div>
      <div class="w-[68px]"></div>
    {:else}
      <!-- Desktop: macOS-style Traffic Light Buttons (Left side) -->
      <div class="flex items-center gap-2 traffic-lights p-2 min-h-[44px]">
        <button
          class="traffic-light traffic-light-close group"
          onclick={handleClose}
          aria-label="Close window"
          title="Close"
        >
          <svg class="traffic-light-icon" viewBox="0 0 12 12">
            <line x1="3" y1="3" x2="9" y2="9"/>
            <line x1="9" y1="3" x2="3" y2="9"/>
          </svg>
        </button>
        <button
          class="traffic-light traffic-light-minimize group"
          onclick={handleMinimize}
          aria-label="Minimize window"
          title="Minimize"
        >
          <svg class="traffic-light-icon" viewBox="0 0 12 12">
            <line x1="2" y1="6" x2="10" y2="6"/>
          </svg>
        </button>
        <button
          class="traffic-light traffic-light-maximize group"
          onclick={handleMaximize}
          aria-label={win.isMaximized ? 'Restore window' : 'Maximize window'}
          title={win.isMaximized ? 'Restore' : 'Maximize'}
        >
          {#if win.isMaximized}
            <svg class="traffic-light-icon" viewBox="0 0 12 12">
              <rect x="2.5" y="4" width="5" height="5" fill="none" rx="0.5"/>
              <path d="M4.5 4V2.5a.5.5 0 0 1 .5-.5H9.5a.5.5 0 0 1 .5.5V7a.5.5 0 0 1-.5.5H8" fill="none"/>
            </svg>
          {:else}
            <svg class="traffic-light-icon" viewBox="0 0 12 12">
              <path d="M2 6L6 2L10 6L6 10Z" fill="none"/>
            </svg>
          {/if}
        </button>
      </div>

      <!-- Centered Title with App Icon -->
      <div class="flex-1 flex items-center justify-center gap-2 min-w-0 px-4">
        <span class="text-sm shrink-0 drop-shadow-sm">{app?.icon}</span>
        <span class="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis
          {win.isFocused ? 'text-slate-100' : 'text-slate-400'}">{win.title}</span>
      </div>

      <!-- Spacer to balance the traffic lights -->
      <div class="w-[68px]"></div>
    {/if}
  </div>

  <!-- Content: Renders based on plugin type -->
  <div class="flex-1 overflow-hidden relative bg-desktop-bg">
    {#if renderMode}
      {@const mode = renderMode}
      {#if mode?.kind === 'iframe'}
        <iframe
          class="w-full h-full border-none bg-[#0f172a]"
          src={mode.url}
          title={win.title}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        ></iframe>
      {:else if mode?.kind === 'component'}
        {@const Component = mode.component}
        {@const props = typeof mode.props === 'function' ? mode.props() : (mode.props ?? {})}
        <div class="w-full h-full overflow-auto bg-desktop-bg text-slate-200">
          <Component windowId={win.id} {...props} />
        </div>
      {:else if mode?.kind === 'webcomponent'}
        <div class="w-full h-full overflow-auto bg-desktop-bg text-slate-200">
          {@html `<${mode.tagName} window-id="${win.id}"></${mode.tagName}>`}
        </div>
      {:else if mode?.kind === 'federation'}
        {@const Component = mode.component}
        <div class="w-full h-full overflow-auto bg-desktop-bg text-slate-200">
          <Component windowId={win.id} />
        </div>
      {:else if mode?.kind === 'federation-offline'}
        <FederationOffline
          remoteUrl={mode.remoteUrl}
          error={mode.error}
          appName={app?.title ?? 'Remote App'}
          appIcon={app?.icon ?? '🔌'}
        />
      {:else if mode?.kind === 'wasm'}
        {@const Wrapper = mode.wrapper}
        <div class="w-full h-full overflow-auto bg-desktop-bg text-slate-200">
          <Wrapper windowId={win.id} />
        </div>
      {/if}
    {/if}
  </div>

  <!-- Resize handles (all 8 directions) - Using Svelte 5 Attachments -->
  {#if app?.resizable !== false && !win.isMaximized && !mobile.isMobile}
    <!-- Edge resize areas (invisible) -->
    <div class="absolute z-10 top-0 left-3 right-3 h-1" {@attach createResizeAttachment('n')}></div>
    <div class="absolute z-10 bottom-0 left-3 right-3 h-1" {@attach createResizeAttachment('s')}></div>
    <div class="absolute z-10 right-0 top-3 bottom-3 w-1" {@attach createResizeAttachment('e')}></div>
    <div class="absolute z-10 left-0 top-3 bottom-3 w-1" {@attach createResizeAttachment('w')}></div>

    <!-- Corner resize handles (visible) -->
    <div
      class="absolute z-20 top-0 right-0 w-4 h-4 resize-handle-corner resize-handle-ne"
      {@attach createResizeAttachment('ne')}
    ></div>
    <div
      class="absolute z-20 top-0 left-0 w-4 h-4 resize-handle-corner resize-handle-nw"
      {@attach createResizeAttachment('nw')}
    ></div>
    <div
      class="absolute z-20 bottom-0 right-0 w-4 h-4 resize-handle-corner resize-handle-se"
      {@attach createResizeAttachment('se')}
    ></div>
    <div
      class="absolute z-20 bottom-0 left-0 w-4 h-4 resize-handle-corner resize-handle-sw"
      {@attach createResizeAttachment('sw')}
    ></div>
  {/if}
</div>

<style>
  /* Window Chrome Base - Enhanced Glass Morphism */
  .window-chrome {
    background: linear-gradient(180deg,
      rgba(30, 41, 59, 0.95) 0%,
      rgba(15, 23, 42, 0.92) 50%,
      rgba(15, 23, 42, 0.98) 100%
    );
    border: 1px solid rgba(148, 163, 184, 0.12);
    backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    font-family: var(--desktop-font-sans);
    transition:
      border-color var(--transition-normal) var(--transition-easing),
      transform var(--transition-normal) var(--transition-easing),
      opacity var(--transition-normal) var(--transition-easing);
    will-change: transform, box-shadow;
  }

  /* Subtle inner glow effect */
  .window-chrome::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(180deg,
      rgba(255, 255, 255, 0.03) 0%,
      transparent 50%
    );
    pointer-events: none;
  }

  /* Focused Window State */
  .window-focused {
    border-color: rgba(var(--desktop-accent-rgb), 0.45);
  }

  .window-unfocused {
    border-color: rgba(71, 85, 105, 0.25);
    opacity: 1;
  }

  /* Enhanced Shadow Classes with Layered Depth */
  .shadow-window-focused {
    box-shadow:
      /* Primary elevation shadow */
      0 32px 64px -20px rgba(0, 0, 0, 0.55),
      0 16px 32px -12px rgba(0, 0, 0, 0.45),
      /* Accent glow */
      0 0 0 1px rgba(var(--desktop-accent-rgb), 0.35),
      0 0 60px -15px rgba(var(--desktop-accent-rgb), 0.25),
      0 0 30px -10px rgba(var(--desktop-accent-rgb), 0.15),
      /* Inner highlight */
      inset 0 1px 1px rgba(255, 255, 255, 0.06),
      inset 0 -1px 1px rgba(0, 0, 0, 0.05);
  }

  .shadow-window-unfocused {
    box-shadow:
      0 12px 35px -12px rgba(0, 0, 0, 0.35),
      0 5px 18px -6px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.025);
  }

  /* Title Bar Glass Effect - Multi-layer Glass */
  .titlebar-glass {
    background: linear-gradient(180deg,
      rgba(51, 65, 85, 0.55) 0%,
      rgba(30, 41, 59, 0.35) 100%
    );
    backdrop-filter: blur(12px) saturate(150%);
    -webkit-backdrop-filter: blur(12px) saturate(150%);
    font-family: var(--desktop-font-sans);
    transition: background var(--transition-normal) ease-out;
    position: relative;
  }

  /* Subtle top highlight on title bar */
  .titlebar-glass::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.08) 20%,
      rgba(255, 255, 255, 0.08) 80%,
      transparent 100%
    );
    pointer-events: none;
  }

  .titlebar-focused {
    background: linear-gradient(180deg,
      rgba(71, 85, 105, 0.55) 0%,
      rgba(51, 65, 85, 0.35) 100%
    );
  }

  .titlebar-unfocused {
    background: linear-gradient(180deg,
      rgba(51, 65, 85, 0.25) 0%,
      rgba(30, 41, 59, 0.15) 100%
    );
  }

  /* macOS Traffic Light Buttons - Enhanced */
  .traffic-lights {
    display: flex;
    gap: 8px;
  }

  .traffic-light {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast) var(--transition-easing);
    position: relative;
    transform-origin: center;
  }

  .traffic-light:hover {
    transform: scale(1.15);
  }

  .traffic-light:active {
    transform: scale(0.9);
  }

  .traffic-light:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(15, 23, 42, 1), 0 0 0 4px rgba(var(--desktop-accent-rgb), 0.8);
  }

  .traffic-light-icon {
    width: 8px;
    height: 8px;
    stroke: transparent;
    stroke-width: 1.5;
    fill: none;
    transition: stroke var(--transition-fast) ease, transform var(--transition-fast) ease;
  }

  .traffic-lights:hover .traffic-light-icon {
    stroke: rgba(0, 0, 0, 0.55);
  }

  .traffic-light:hover .traffic-light-icon {
    transform: scale(1.1);
  }

  /* Close Button - Red with enhanced gradients */
  .traffic-light-close {
    background: linear-gradient(180deg, #ff6058 0%, #e8453b 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1),
      0 1px 3px rgba(0, 0, 0, 0.25);
  }

  .traffic-light-close:hover {
    background: linear-gradient(180deg, #ff7b74 0%, #ff6058 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      0 0 12px rgba(255, 96, 88, 0.4);
  }

  .traffic-light-close:active {
    background: linear-gradient(180deg, #e8453b 0%, #d13328 100%);
  }

  /* Minimize Button - Yellow with enhanced gradients */
  .traffic-light-minimize {
    background: linear-gradient(180deg, #ffbd2e 0%, #e5a00d 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1),
      0 1px 3px rgba(0, 0, 0, 0.25);
  }

  .traffic-light-minimize:hover {
    background: linear-gradient(180deg, #ffc94d 0%, #ffbd2e 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      0 0 12px rgba(255, 189, 46, 0.4);
  }

  .traffic-light-minimize:active {
    background: linear-gradient(180deg, #e5a00d 0%, #cc8b00 100%);
  }

  /* Maximize Button - Green with enhanced gradients */
  .traffic-light-maximize {
    background: linear-gradient(180deg, #28c940 0%, #1aab29 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1),
      0 1px 3px rgba(0, 0, 0, 0.25);
  }

  .traffic-light-maximize:hover {
    background: linear-gradient(180deg, #45d95b 0%, #28c940 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      0 0 12px rgba(40, 201, 64, 0.4);
  }

  .traffic-light-maximize:active {
    background: linear-gradient(180deg, #1aab29 0%, #0f9418 100%);
  }

  /* Unfocused traffic lights */
  .window-unfocused .traffic-light-close,
  .window-unfocused .traffic-light-minimize,
  .window-unfocused .traffic-light-maximize {
    background: linear-gradient(180deg, #6b7280 0%, #4b5563 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      0 1px 2px rgba(0, 0, 0, 0.15);
  }

  .window-unfocused .traffic-lights:hover .traffic-light-close {
    background: linear-gradient(180deg, #ff6058 0%, #e8453b 100%);
  }

  .window-unfocused .traffic-lights:hover .traffic-light-minimize {
    background: linear-gradient(180deg, #ffbd2e 0%, #e5a00d 100%);
  }

  .window-unfocused .traffic-lights:hover .traffic-light-maximize {
    background: linear-gradient(180deg, #28c940 0%, #1aab29 100%);
  }

  /* Visible Corner Resize Handles - Enhanced */
  .resize-handle-corner {
    opacity: 0;
    transition: opacity var(--transition-normal) ease-out, transform var(--transition-normal) ease-out;
  }

  .window-chrome:hover .resize-handle-corner {
    opacity: 1;
  }

  .resize-handle-corner:hover {
    transform: scale(1.1);
  }

  .resize-handle-se::after {
    content: '';
    position: absolute;
    bottom: 3px;
    right: 3px;
    width: 10px;
    height: 10px;
    background: linear-gradient(135deg, transparent 50%, rgba(148, 163, 184, 0.5) 50%);
    border-radius: 0 0 4px 0;
    transition: background var(--transition-fast) ease;
  }

  .resize-handle-se:hover::after {
    background: linear-gradient(135deg, transparent 50%, rgba(var(--desktop-accent-rgb), 0.6) 50%);
  }

  .resize-handle-sw::after {
    content: '';
    position: absolute;
    bottom: 3px;
    left: 3px;
    width: 10px;
    height: 10px;
    background: linear-gradient(225deg, transparent 50%, rgba(148, 163, 184, 0.5) 50%);
    border-radius: 0 0 0 4px;
    transition: background var(--transition-fast) ease;
  }

  .resize-handle-sw:hover::after {
    background: linear-gradient(225deg, transparent 50%, rgba(var(--desktop-accent-rgb), 0.6) 50%);
  }

  .resize-handle-ne::after {
    content: '';
    position: absolute;
    top: 3px;
    right: 3px;
    width: 10px;
    height: 10px;
    background: linear-gradient(45deg, transparent 50%, rgba(148, 163, 184, 0.5) 50%);
    border-radius: 0 4px 0 0;
    transition: background var(--transition-fast) ease;
  }

  .resize-handle-ne:hover::after {
    background: linear-gradient(45deg, transparent 50%, rgba(var(--desktop-accent-rgb), 0.6) 50%);
  }

  .resize-handle-nw::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 10px;
    height: 10px;
    background: linear-gradient(315deg, transparent 50%, rgba(148, 163, 184, 0.5) 50%);
    border-radius: 4px 0 0 0;
    transition: background var(--transition-fast) ease;
  }

  .resize-handle-nw:hover::after {
    background: linear-gradient(315deg, transparent 50%, rgba(var(--desktop-accent-rgb), 0.6) 50%);
  }

  /* Window animations */
  @keyframes window-open {
    from {
      opacity: 0;
      transform: scale(0.92) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes window-close {
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to {
      opacity: 0;
      transform: scale(0.92) translateY(8px);
    }
  }

  @keyframes window-minimize {
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to {
      opacity: 0;
      transform: scale(0.5) translateY(100px);
    }
  }

  @keyframes window-maximize {
    from {
      border-radius: 0.75rem;
    }
    to {
      border-radius: 0;
    }
  }

  @keyframes window-restore {
    from {
      border-radius: 0;
    }
    to {
      border-radius: 0.75rem;
    }
  }

  .animate-window-open {
    animation: window-open 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .animate-window-close {
    animation: window-close 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
  }

  .animate-window-minimize {
    animation: window-minimize 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
  }

  .animate-window-maximize {
    animation: window-maximize 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-window-restore {
    animation: window-restore 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .animate-window-open,
    .animate-window-close,
    .animate-window-minimize,
    .animate-window-maximize,
    .animate-window-restore {
      animation: none !important;
    }
  }
</style>
