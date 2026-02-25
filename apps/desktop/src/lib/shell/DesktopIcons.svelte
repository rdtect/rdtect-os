<script lang="ts">
  import { wm } from './registry.svelte';
  import type { AppDefinition } from './types';
  import { mobile } from '$lib/core/mobile.svelte';

  const STORAGE_KEY = 'desktop-hidden-icons';
  const POSITIONS_STORAGE_KEY = 'desktop-icon-positions';
  const GRID_SIZE = 88; // Grid cell size for snapping
  const ICON_WIDTH = 88;
  const ICON_HEIGHT = 96;

  interface Props {
    onContextMenu?: (e: MouseEvent, app: AppDefinition) => void;
  }

  interface IconPosition {
    x: number;
    y: number;
  }

  let { onContextMenu }: Props = $props();

  let selectedId = $state<string | null>(null);
  let lastClickTime = $state(0);
  let lastClickId = $state<string | null>(null);
  let containerRef = $state<HTMLElement | null>(null);

  // Hidden icons state - load from localStorage on init
  let hiddenIconIds = $state<Set<string>>(new Set());

  // Icon positions state
  let iconPositions = $state<Record<string, IconPosition>>({});

  // Drag state
  let draggingId = $state<string | null>(null);
  let dragStartPos = $state<{ x: number; y: number } | null>(null);
  let dragOffset = $state<{ x: number; y: number }>({ x: 0, y: 0 });
  let currentDragPos = $state<{ x: number; y: number } | null>(null);

  // Initialize from localStorage
  function loadHiddenIcons(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      // Ignore parse errors
    }
    return new Set();
  }

  // Load icon positions from localStorage
  function loadIconPositions(): Record<string, IconPosition> {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(POSITIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return {};
  }

  // Save to localStorage
  function saveHiddenIcons(ids: Set<string>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // Ignore storage errors
    }
  }

  // Save icon positions to localStorage
  function saveIconPositions(positions: Record<string, IconPosition>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
    } catch {
      // Ignore storage errors
    }
  }

  // Initialize on mount
  $effect(() => {
    hiddenIconIds = loadHiddenIcons();
    iconPositions = loadIconPositions();
  });

  // Persist changes to localStorage
  $effect(() => {
    if (hiddenIconIds.size > 0 || localStorage.getItem(STORAGE_KEY)) {
      saveHiddenIcons(hiddenIconIds);
    }
  });

  // Persist icon positions to localStorage
  $effect(() => {
    if (Object.keys(iconPositions).length > 0 || localStorage.getItem(POSITIONS_STORAGE_KEY)) {
      saveIconPositions(iconPositions);
    }
  });

  // Hide an icon from the desktop
  export function hideIcon(appId: string) {
    hiddenIconIds = new Set([...hiddenIconIds, appId]);
  }

  // Show a hidden icon
  export function showIcon(appId: string) {
    const newSet = new Set(hiddenIconIds);
    newSet.delete(appId);
    hiddenIconIds = newSet;
  }

  // Show all hidden icons
  export function showAllIcons() {
    hiddenIconIds = new Set();
  }

  // Reset all icon positions to default grid layout
  export function resetIconPositions() {
    iconPositions = {};
    localStorage.removeItem(POSITIONS_STORAGE_KEY);
  }

  // Get list of hidden icons (for use in menus)
  export function getHiddenIcons(): AppDefinition[] {
    return wm.apps.filter(app => hiddenIconIds.has(app.id));
  }

  // Check if there are hidden icons
  export function hasHiddenIcons(): boolean {
    return hiddenIconIds.size > 0;
  }

  // Check if any icon has a custom position
  export function hasCustomPositions(): boolean {
    return Object.keys(iconPositions).length > 0;
  }

  // Get default grid position for an icon by index
  function getDefaultPosition(index: number): IconPosition {
    const containerHeight = containerRef?.clientHeight ?? window.innerHeight - 180;
    const iconsPerColumn = Math.floor(containerHeight / (ICON_HEIGHT + 12));
    const col = Math.floor(index / iconsPerColumn);
    const row = index % iconsPerColumn;
    return {
      x: col * (ICON_WIDTH + 12),
      y: row * (ICON_HEIGHT + 12)
    };
  }

  // Snap position to grid
  function snapToGrid(pos: IconPosition): IconPosition {
    return {
      x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE
    };
  }

  // Clamp position within desktop bounds
  function clampToBounds(pos: IconPosition): IconPosition {
    const maxX = (containerRef?.clientWidth ?? 400) - ICON_WIDTH;
    const maxY = (containerRef?.clientHeight ?? 600) - ICON_HEIGHT;
    return {
      x: Math.max(0, Math.min(pos.x, maxX)),
      y: Math.max(0, Math.min(pos.y, maxY))
    };
  }

  function handleDoubleClick(appId: string) {
    // Don't open if we just finished dragging
    if (draggingId) return;
    wm.openWindow(appId);
    selectedId = null;
  }

  function handleClick(e: MouseEvent, appId: string) {
    e.stopPropagation();

    // Don't process click if we just finished dragging
    if (draggingId) return;

    // Double-click detection for touch/accessibility
    const now = Date.now();
    if (lastClickId === appId && now - lastClickTime < 400) {
      handleDoubleClick(appId);
      lastClickTime = 0;
      lastClickId = null;
      return;
    }

    lastClickTime = now;
    lastClickId = appId;
    selectedId = appId;
  }

  function handleDesktopClick() {
    selectedId = null;
  }

  function handleContextMenu(e: MouseEvent, app: AppDefinition) {
    e.preventDefault();
    selectedId = app.id;
    onContextMenu?.(e, app);
  }

  function handleKeydown(e: KeyboardEvent, appId: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      wm.openWindow(appId);
    }
  }

  function handleRemoveClick(e: MouseEvent, appId: string) {
    e.stopPropagation();
    e.preventDefault();
    hideIcon(appId);
  }

  // Drag handlers
  function handleMouseDown(e: MouseEvent, appId: string, index: number) {
    // Only left mouse button
    if (e.button !== 0) return;

    // Don't start drag on remove button
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();

    const iconPos = iconPositions[appId] ?? getDefaultPosition(index);

    draggingId = appId;
    dragStartPos = { x: e.clientX, y: e.clientY };
    dragOffset = {
      x: e.clientX - iconPos.x,
      y: e.clientY - iconPos.y
    };
    currentDragPos = iconPos;
    selectedId = appId;

    // Add document-level listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  function handleMouseMove(e: MouseEvent) {
    if (!draggingId || !containerRef) return;

    const containerRect = containerRef.getBoundingClientRect();

    // Calculate new position relative to container
    let newX = e.clientX - containerRect.left - dragOffset.x + (iconPositions[draggingId]?.x ?? 0);
    let newY = e.clientY - containerRect.top - dragOffset.y + (iconPositions[draggingId]?.y ?? 0);

    // Simpler calculation: just use cursor position minus container offset
    newX = e.clientX - containerRect.left - (ICON_WIDTH / 2);
    newY = e.clientY - containerRect.top - (ICON_HEIGHT / 4);

    currentDragPos = clampToBounds({ x: newX, y: newY });
  }

  function handleMouseUp(e: MouseEvent) {
    if (!draggingId || !currentDragPos) {
      cleanup();
      return;
    }

    // Check if we actually dragged (not just a click)
    const didDrag = dragStartPos && (
      Math.abs(e.clientX - dragStartPos.x) > 5 ||
      Math.abs(e.clientY - dragStartPos.y) > 5
    );

    if (didDrag) {
      // Snap to grid and save position
      const snappedPos = snapToGrid(clampToBounds(currentDragPos));
      iconPositions = { ...iconPositions, [draggingId]: snappedPos };
    }

    cleanup();
  }

  function cleanup() {
    // Reset click detection if we dragged
    if (draggingId) {
      lastClickTime = 0;
      lastClickId = null;
    }

    draggingId = null;
    dragStartPos = null;
    currentDragPos = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  // Get icon position (custom or default)
  function getIconPosition(appId: string, index: number): IconPosition {
    if (draggingId === appId && currentDragPos) {
      return currentDragPos;
    }
    return iconPositions[appId] ?? getDefaultPosition(index);
  }

  // Get pinned/favorite apps (first 12 for desktop shortcuts), excluding hidden ones
  const desktopApps = $derived(
    wm.apps.slice(0, 12).filter(app => !hiddenIconIds.has(app.id))
  );
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if mobile.isMobile}
  <!-- Mobile: iOS-style centered icon grid -->
  <div class="absolute inset-0 flex flex-col items-center pt-12 px-4 overflow-y-auto" onclick={handleDesktopClick}>
    <!-- Status bar area (time) -->
    <div class="text-center mb-6">
      <div class="text-white/90 font-light tabular-nums" style="font-size: var(--text-4xl); font-family: var(--desktop-font-sans);">
        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </div>
      <div class="text-white/60 mt-1" style="font-size: var(--text-sm); font-family: var(--desktop-font-sans);">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
    </div>

    <!-- App grid -->
    <div class="grid grid-cols-4 gap-x-6 gap-y-4 w-full max-w-[340px]">
      {#each desktopApps as app, index (app.id)}
        <button
          class="flex flex-col items-center gap-1.5 active:scale-90 transition-transform duration-100"
          style="animation-delay: {index * 30}ms"
          onclick={() => { wm.openWindow(app.id); }}
          oncontextmenu={(e) => handleContextMenu(e, app)}
          aria-label="Open {app.title}"
        >
          <div class="w-14 h-14 flex items-center justify-center rounded-[16px] bg-gradient-to-br from-white/15 to-white/5 border border-white/10 shadow-lg">
            <span class="text-[28px] leading-none">{app.icon}</span>
          </div>
          <span class="text-[11px] text-white/80 text-center leading-tight line-clamp-2 max-w-[64px]">
            {app.title}
          </span>
        </button>
      {/each}
    </div>
  </div>
{:else}
  <!-- Desktop: Absolute-positioned draggable icons -->
  <div
    bind:this={containerRef}
    class="absolute top-20 left-4 right-4 bottom-20 p-3"
    onclick={handleDesktopClick}
  >
    {#each desktopApps as app, index (app.id)}
      {@const pos = getIconPosition(app.id, index)}
      {@const isDragging = draggingId === app.id}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="icon group absolute flex flex-col items-center justify-start p-2 rounded-xl select-none
          focus:outline-none focus-visible:ring-2 focus-visible:ring-desktop-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
          {isDragging ? 'cursor-grabbing z-50 scale-105 opacity-90' : 'cursor-grab'}
          {!isDragging ? 'transition-all duration-200 ease-out hover:bg-white/[0.06] hover:backdrop-blur-sm hover:scale-105 active:scale-95' : ''}
          {selectedId === app.id && !isDragging ? 'bg-desktop-accent/20 ring-1 ring-desktop-accent/40 backdrop-blur-sm' : ''}"
        style="
          left: {pos.x}px;
          top: {pos.y}px;
          width: {ICON_WIDTH}px;
          height: {ICON_HEIGHT}px;
          animation-delay: {index * 50}ms;
          {isDragging ? 'filter: drop-shadow(0 10px 20px rgba(0,0,0,0.4));' : ''}
        "
        ondblclick={() => handleDoubleClick(app.id)}
        onclick={(e) => handleClick(e, app.id)}
        oncontextmenu={(e) => handleContextMenu(e, app)}
        onkeydown={(e) => handleKeydown(e, app.id)}
        onmousedown={(e) => handleMouseDown(e, app.id, index)}
        tabindex="0"
        role="button"
        aria-label="Open {app.title}"
      >
        <!-- Drag indicator - shows during drag -->
        {#if isDragging}
          <div class="absolute inset-0 rounded-xl border-2 border-dashed border-desktop-accent/60 pointer-events-none"></div>
        {/if}

        <!-- Icon container with glow effect -->
        <div class="relative w-14 h-14 flex items-center justify-center mb-2">
          <!-- Glow effect on hover -->
          <div class="absolute inset-0 rounded-2xl bg-desktop-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
            {isDragging ? 'opacity-100' : ''}"></div>

          <!-- Icon background -->
          <div class="relative w-12 h-12 flex items-center justify-center rounded-[14px] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-lg shadow-black/20
            transition-all duration-200
            group-hover:shadow-xl group-hover:shadow-desktop-accent/20 group-hover:border-desktop-accent/30
            {selectedId === app.id ? 'shadow-desktop-accent/30 border-desktop-accent/40' : ''}
            {isDragging ? 'shadow-xl shadow-desktop-accent/40 border-desktop-accent/50' : ''}">
            <span class="text-[26px] leading-none drop-shadow-md">{app.icon}</span>
          </div>
        </div>

        <!-- Label with text shadow for readability -->
        <span class="text-[11px] text-slate-200 text-center leading-tight max-w-[76px] px-1 py-0.5 rounded
          font-medium tracking-wide
          overflow-hidden text-ellipsis line-clamp-2
          drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]
          {selectedId === app.id ? 'bg-desktop-accent/30 text-white' : ''}">
          {app.title}
        </span>
      </div>
    {/each}

    <!-- Grid preview overlay during drag -->
    {#if draggingId && currentDragPos}
      {@const snappedPos = snapToGrid(clampToBounds(currentDragPos))}
      <div class="absolute inset-0 pointer-events-none">
        <!-- Show snap grid indicator -->
        <div
          class="absolute w-[88px] h-[96px] rounded-xl border-2 border-desktop-accent/30 bg-desktop-accent/10 transition-all duration-75"
          style="left: {snappedPos.x}px; top: {snappedPos.y}px;"
        ></div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
