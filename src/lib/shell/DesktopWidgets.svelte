<script lang="ts">
  import { onMount, type Component } from 'svelte';
  import { theme } from '$lib/core/theme';
  import { widgetRegistry } from '$lib/core/widget-registry.svelte';
  import { wm } from './registry.svelte';
  import ContextMenu from './ContextMenu.svelte';

  // Import ClockWidget dynamically from plugins
  const clockWidgetModules = import.meta.glob<{ default: Component }>(
    '/plugins/clock/src/ClockWidget.svelte',
    { eager: true }
  );
  const ClockWidget = Object.values(clockWidgetModules)[0]?.default;

  // ============== System State ==============
  let batteryLevel = $state(87);
  let isCharging = $state(false);
  let wifiStrength = $state(3); // 0-4 bars
  let wifiConnected = $state(true);
  let volume = $state(75);
  let isMuted = $state(false);
  let notifications = $state(2);
  let brightness = $state(80);

  // Quick Settings toggles
  let wifiEnabled = $state(true);
  let bluetoothEnabled = $state(false);
  let doNotDisturb = $state(false);

  // UI State
  let showVolumeSlider = $state(false);
  let showQuickSettings = $state(false);
  let showCalendar = $state(false);

  // Calendar state
  let calendarDate = $state(new Date());
  let currentMonth = $derived(calendarDate.getMonth());
  let currentYear = $derived(calendarDate.getFullYear());

  // WiFi animation state
  let wifiAnimationFrame = $state(0);

  // Widget dragging state
  let draggingWidgetId = $state<string | null>(null);
  let dragOffset = $state({ x: 0, y: 0 });

  // Calendar helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function getCalendarDays() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= totalDays; i++) {
      const isToday = today.getDate() === i &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear;
      days.push({ day: i, isCurrentMonth: true, isToday });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, isToday: false });
    }

    return days;
  }

  let calendarDays = $derived(getCalendarDays());

  function prevMonth() {
    calendarDate = new Date(currentYear, currentMonth - 1, 1);
  }

  function nextMonth() {
    calendarDate = new Date(currentYear, currentMonth + 1, 1);
  }

  function goToToday() {
    calendarDate = new Date();
  }

  // Battery API integration
  onMount(() => {
    // Try to use the Battery API (not available in all browsers/contexts)
    if ('getBattery' in navigator) {
      (navigator as Navigator & { getBattery: () => Promise<BatteryManager> }).getBattery().then((battery: BatteryManager) => {
        batteryLevel = Math.round(battery.level * 100);
        isCharging = battery.charging;

        // Some browsers don't support addEventListener on battery
        if (typeof battery.addEventListener === 'function') {
          battery.addEventListener('levelchange', () => {
            batteryLevel = Math.round(battery.level * 100);
          });
          battery.addEventListener('chargingchange', () => {
            isCharging = battery.charging;
          });
        }
      }).catch(() => {
        // Battery API not available or failed
        batteryLevel = 100;
        isCharging = true;
      });
    }

    // WiFi animation
    const wifiInterval = setInterval(() => {
      if (wifiConnected) {
        wifiAnimationFrame = (wifiAnimationFrame + 1) % 4;
      }
    }, 2000);

    return () => clearInterval(wifiInterval);
  });

  // Close popups when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.quick-settings-container')) {
      showQuickSettings = false;
    }
    if (!target.closest('.volume-container')) {
      showVolumeSlider = false;
    }
    if (!target.closest('.calendar-container')) {
      showCalendar = false;
    }
    // Close widget context menu when clicking outside
    if (!target.closest('.context-menu')) {
      widgetContextMenu.show = false;
    }
  }

  // Volume control
  function toggleMute() {
    isMuted = !isMuted;
  }

  function setVolume(newVolume: number) {
    volume = newVolume;
    if (newVolume > 0) isMuted = false;
  }

  // Theme toggle
  function toggleTheme() {
    theme.toggle();
  }

  // Widget drag handlers
  function startWidgetDrag(e: MouseEvent, widgetId: string) {
    const widget = widgetRegistry.get(widgetId);
    if (!widget) return;

    // Only start drag on mouse down with left button
    if (e.button !== 0) return;

    // Prevent text selection
    e.preventDefault();

    draggingWidgetId = widgetId;
    dragOffset = {
      x: e.clientX - widget.position.x,
      y: e.clientY - widget.position.y
    };

    // Add global listeners
    window.addEventListener('mousemove', handleWidgetDrag);
    window.addEventListener('mouseup', stopWidgetDrag);
  }

  function handleWidgetDrag(e: MouseEvent) {
    if (!draggingWidgetId) return;

    const widget = widgetRegistry.get(draggingWidgetId);
    if (!widget) return;

    // Calculate new position with bounds checking
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // Keep widget within viewport bounds
    const maxX = window.innerWidth - widget.size.width;
    const maxY = window.innerHeight - 56 - widget.size.height; // Account for taskbar

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    widgetRegistry.move(draggingWidgetId, newX, newY);
  }

  function stopWidgetDrag() {
    draggingWidgetId = null;
    window.removeEventListener('mousemove', handleWidgetDrag);
    window.removeEventListener('mouseup', stopWidgetDrag);
  }

  // Battery type definition
  interface BatteryManager extends EventTarget {
    charging: boolean;
    level: number;
    addEventListener(type: string, listener: EventListener): void;
  }

  // Get visible widgets from registry
  let visibleWidgets = $derived(widgetRegistry.visibleWidgets);

  // Widget context menu state
  let widgetContextMenu = $state<{
    show: boolean;
    x: number;
    y: number;
    widgetId: string;
    pluginId: string;
    widgetName: string;
  }>({
    show: false,
    x: 0,
    y: 0,
    widgetId: '',
    pluginId: '',
    widgetName: ''
  });

  // Show context menu for a widget
  function showWidgetContextMenu(e: MouseEvent, widget: typeof visibleWidgets[0]) {
    e.preventDefault();
    e.stopPropagation();

    widgetContextMenu = {
      show: true,
      x: e.clientX,
      y: e.clientY,
      widgetId: widget.id,
      pluginId: widget.pluginId,
      widgetName: widget.name
    };
  }

  // Close widget context menu
  function closeWidgetContextMenu() {
    widgetContextMenu.show = false;
  }

  // Get context menu items for widget
  function getWidgetContextMenuItems() {
    const { widgetId, pluginId, widgetName } = widgetContextMenu;
    const app = wm.getApp(pluginId);

    const items: Array<{ label: string; icon?: string; action?: () => void; separator?: boolean; disabled?: boolean }> = [
      {
        label: 'Small Size',
        icon: '🔹',
        action: () => widgetRegistry.setSize(widgetId, 'small')
      },
      {
        label: 'Medium Size',
        icon: '🔸',
        action: () => widgetRegistry.setSize(widgetId, 'medium')
      },
      {
        label: 'Large Size',
        icon: '🔶',
        action: () => widgetRegistry.setSize(widgetId, 'large')
      },
      { separator: true, label: '' },
      {
        label: 'Hide Widget',
        icon: '👁️',
        action: () => widgetRegistry.hide(widgetId)
      }
    ];

    // Add "Open App" option if there's a corresponding app
    if (app) {
      items.push({ separator: true, label: '' });
      items.push({
        label: `Open ${app.title}`,
        icon: '📂',
        action: () => wm.openWindow(pluginId)
      });
    }

    return items;
  }

  // Derived context menu items
  let widgetMenuItems = $derived(widgetContextMenu.show ? getWidgetContextMenuItems() : []);
</script>

<svelte:window onclick={handleClickOutside} />

<!-- Plugin Widgets Layer (draggable, positioned anywhere) -->
{#each visibleWidgets as widget (widget.id)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="absolute z-10 pointer-events-auto widget-container"
    class:dragging={draggingWidgetId === widget.id}
    style:left="{widget.position.x}px"
    style:top="{widget.position.y}px"
    style:width="{widget.size.width}px"
    style:height="{widget.size.height}px"
    oncontextmenu={(e) => showWidgetContextMenu(e, widget)}
  >
    <!-- Drag handle (top area of widget) -->
    <div
      class="absolute -top-1 left-0 right-0 h-4 cursor-move z-20 opacity-0 hover:opacity-100 transition-opacity"
      onmousedown={(e) => startWidgetDrag(e, widget.id)}
    >
      <div class="mx-auto w-8 h-1 mt-1 rounded-full bg-slate-500/50"></div>
    </div>

    <!-- Widget content -->
    <widget.component />
  </div>
{/each}

<!-- Top-right widgets area (system tray - fixed position) -->
<div class="absolute top-4 right-4 flex items-start gap-3 z-10 pointer-events-auto max-w-[calc(100vw-2rem)]">

  <!-- System Tray -->
  <div class="quick-settings-container relative">
    <div class="glass-panel rounded-2xl px-3 py-2 flex items-center gap-1">

      <!-- WiFi Indicator -->
      <button
        class="tray-icon w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 {wifiConnected ? 'text-slate-200' : 'text-slate-500'}"
        title="WiFi: {wifiConnected ? `Connected (${wifiStrength}/4 bars)` : 'Disconnected'}"
        onclick={() => showQuickSettings = !showQuickSettings}
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          {#if !wifiEnabled}
            <!-- WiFi Off -->
            <path d="M23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l10.08 12.56c.8 1 2.32 1 3.12 0L23.64 7z" opacity="0.2"/>
            <path d="M2.5 3.5L21.5 22.5M23.64 7c-.45-.34-4.93-4-11.64-4-2.14 0-4.07.36-5.76.95M.36 7C1.87 5.8 5.58 3.5 12 3.5c.98 0 1.91.08 2.79.21" stroke="currentColor" stroke-width="2" fill="none"/>
          {:else if wifiStrength === 0}
            <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" opacity="0.3"/>
          {:else if wifiStrength === 1}
            <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
            <path d="M8.46 14.54l1.41 1.41C10.81 15.02 11.38 15 12 15s1.19.02 2.13.95l1.41-1.41C13.63 12.63 12 12 12 12s-1.63.63-3.54 2.54z" opacity="0.3"/>
          {:else if wifiStrength === 2}
            <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
            <path d="M8.46 14.54l1.41 1.41C10.81 15.02 11.38 15 12 15s1.19.02 2.13.95l1.41-1.41C13.63 12.63 12 12 12 12s-1.63.63-3.54 2.54z"/>
            <path d="M5.64 11.64l1.41 1.41C8.47 11.63 10.14 11 12 11s3.53.63 4.95 2.05l1.41-1.41C16.43 9.68 14.37 9 12 9s-4.43.68-6.36 2.64z" opacity="0.3"/>
          {:else if wifiStrength >= 3}
            <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
            <path d="M8.46 14.54l1.41 1.41C10.81 15.02 11.38 15 12 15s1.19.02 2.13.95l1.41-1.41C13.63 12.63 12 12 12 12s-1.63.63-3.54 2.54z"/>
            <path d="M5.64 11.64l1.41 1.41C8.47 11.63 10.14 11 12 11s3.53.63 4.95 2.05l1.41-1.41C16.43 9.68 14.37 9 12 9s-4.43.68-6.36 2.64z"/>
            <path d="M2.81 8.81l1.42 1.42C6.03 8.43 8.83 7.5 12 7.5s5.97.93 7.77 2.73l1.42-1.42C18.89 6.51 15.65 5.5 12 5.5s-6.89 1.01-9.19 3.31z" class="{wifiAnimationFrame % 2 === 0 ? 'opacity-100' : 'opacity-70'} transition-opacity duration-500"/>
          {/if}
        </svg>
      </button>

      <!-- Volume Control -->
      <div class="volume-container relative">
        <button
          class="tray-icon w-9 h-9 rounded-xl flex items-center justify-center text-slate-200 hover:text-white"
          title="Volume: {isMuted ? 'Muted' : `${volume}%`}"
          onclick={() => showVolumeSlider = !showVolumeSlider}
          ondblclick={toggleMute}
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            {#if isMuted || volume === 0}
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            {:else if volume < 30}
              <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
            {:else if volume < 70}
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            {:else}
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            {/if}
          </svg>
        </button>

        <!-- Volume Slider Popup -->
        {#if showVolumeSlider}
          <div class="absolute top-full right-0 mt-2 glass-panel rounded-2xl p-4 w-48 shadow-2xl animate-slide-down">
            <div class="flex items-center gap-3 mb-3">
              <button onclick={toggleMute} class="text-slate-400 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  {#if isMuted}
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  {:else}
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  {/if}
                </svg>
              </button>
              <div class="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  oninput={(e) => setVolume(parseInt(e.currentTarget.value))}
                  class="w-full h-2 rounded-full appearance-none bg-slate-700 cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-desktop-accent
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:shadow-indigo-500/30
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110"
                />
                <div
                  class="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-desktop-accent to-indigo-400 pointer-events-none"
                  style="width: {volume}%"
                ></div>
              </div>
              <span class="text-sm text-slate-300 w-8 text-right font-medium tabular-nums">{volume}%</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Battery Indicator -->
      <button
        class="tray-icon w-9 h-9 rounded-xl flex items-center justify-center gap-1 {batteryLevel <= 20 && !isCharging ? 'text-red-400' : 'text-slate-200'}"
        title="Battery: {batteryLevel}%{isCharging ? ' (Charging)' : ''}"
      >
        <div class="relative">
          <svg class="w-6 h-4" viewBox="0 0 24 14" fill="none">
            <!-- Battery body -->
            <rect x="1" y="1" width="19" height="12" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <!-- Battery tip -->
            <rect x="21" y="4" width="2" height="6" rx="0.5" fill="currentColor"/>
            <!-- Battery fill -->
            <rect
              x="2.5"
              y="2.5"
              width="{(batteryLevel / 100) * 16}"
              height="9"
              rx="1"
              class="{batteryLevel <= 20 ? 'fill-red-500' : batteryLevel <= 50 ? 'fill-amber-400' : 'fill-green-400'}"
            />
            {#if isCharging}
              <!-- Lightning bolt for charging -->
              <path d="M10 1L7 7h3l-2 6 5-7h-3l2-5z" fill="currentColor" class="text-yellow-400"/>
            {/if}
          </svg>
        </div>
        <span class="text-[10px] font-medium tabular-nums">{batteryLevel}%</span>
      </button>

      <!-- Notification Bell -->
      <button
        class="tray-icon w-9 h-9 rounded-xl flex items-center justify-center text-slate-200 hover:text-white relative"
        title="{notifications > 0 ? `${notifications} new notifications` : 'No new notifications'}"
        onclick={() => doNotDisturb = !doNotDisturb}
      >
        {#if doNotDisturb}
          <svg class="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm0-18C8.1 4 5 7.1 5 11v6l-2 2v1h18v-1l-2-2v-6c0-3.9-3.1-7-7-7zm0 2c2.8 0 5 2.2 5 5v6.5l.5.5h-11l.5-.5V11c0-2.8 2.2-5 5-5z"/>
            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2"/>
          </svg>
        {:else}
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
          </svg>
        {/if}
        {#if notifications > 0 && !doNotDisturb}
          <span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 animate-pulse-glow shadow-lg shadow-red-500/30">
            {notifications > 9 ? '9+' : notifications}
          </span>
        {/if}
      </button>
    </div>

    <!-- Quick Settings Panel Popup -->
    {#if showQuickSettings}
      <div class="absolute top-full right-0 mt-2 glass-panel rounded-2xl p-4 w-[min(320px,calc(100vw-2rem))] shadow-2xl animate-slide-down">
        <div class="space-y-4">
          <!-- Quick Toggles Grid -->
          <div class="grid grid-cols-3 gap-2">
            <!-- WiFi Toggle -->
            <button
              onclick={() => wifiEnabled = !wifiEnabled}
              class="quick-toggle flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 {wifiEnabled ? 'bg-desktop-accent/20 text-desktop-accent border border-desktop-accent/30' : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700/50'}"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4.95-4.95l1.41 1.41C9.4 15.38 10.68 16 12 16s2.6-.62 3.54-1.54l1.41-1.41C15.68 14.32 13.96 15 12 15s-3.68-.68-4.95-1.95zm-2.83-2.83l1.42 1.42C7.21 13.21 9.47 14 12 14s4.79-.79 6.36-2.36l1.42-1.42C17.63 12.37 14.96 13.5 12 13.5S6.37 12.37 4.22 10.22zm-2.83-2.83l1.41 1.41C5.03 10.03 8.3 11.5 12 11.5s6.97-1.47 9.19-3.69l1.41-1.41C19.92 9.07 16.17 11 12 11S4.08 9.07 1.39 6.39z"/>
              </svg>
              <span class="text-xs font-medium">WiFi</span>
            </button>

            <!-- Bluetooth Toggle -->
            <button
              onclick={() => bluetoothEnabled = !bluetoothEnabled}
              class="quick-toggle flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 {bluetoothEnabled ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700/50'}"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
              </svg>
              <span class="text-xs font-medium">Bluetooth</span>
            </button>

            <!-- Do Not Disturb Toggle -->
            <button
              onclick={() => doNotDisturb = !doNotDisturb}
              class="quick-toggle flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 {doNotDisturb ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700/50'}"
            >
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
              </svg>
              <span class="text-xs font-medium">Focus</span>
            </button>
          </div>

          <!-- Theme Toggle -->
          <div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                {#if theme.activeThemeId === 'dark'}
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                {:else}
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                {/if}
              </svg>
              <span class="text-sm text-slate-200">Dark Mode</span>
            </div>
            <button
              onclick={toggleTheme}
              aria-label="Toggle dark mode"
              class="relative w-12 h-6 bg-slate-700 rounded-full transition-colors duration-300 {theme.activeThemeId === 'dark' ? 'bg-desktop-accent' : ''}"
            >
              <span
                class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 {theme.activeThemeId === 'dark' ? 'translate-x-6' : ''}"
              ></span>
            </button>
          </div>

          <!-- Brightness Slider -->
          <div class="p-3 bg-slate-800/50 rounded-xl">
            <div class="flex items-center gap-3 mb-2">
              <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/>
              </svg>
              <span class="text-sm text-slate-200 flex-1">Brightness</span>
              <span class="text-xs text-slate-400 tabular-nums">{brightness}%</span>
            </div>
            <div class="relative">
              <input
                type="range"
                min="10"
                max="100"
                value={brightness}
                oninput={(e) => brightness = parseInt(e.currentTarget.value)}
                class="w-full h-2 rounded-full appearance-none bg-slate-700 cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-amber-400
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-amber-500/30
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div
                class="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 pointer-events-none"
                style="width: {brightness}%"
              ></div>
            </div>
          </div>

          <!-- Volume Slider in Quick Settings -->
          <div class="p-3 bg-slate-800/50 rounded-xl">
            <div class="flex items-center gap-3 mb-2">
              <svg class="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <span class="text-sm text-slate-200 flex-1">Volume</span>
              <span class="text-xs text-slate-400 tabular-nums">{isMuted ? 'Muted' : `${volume}%`}</span>
            </div>
            <div class="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                oninput={(e) => setVolume(parseInt(e.currentTarget.value))}
                class="w-full h-2 rounded-full appearance-none bg-slate-700 cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-desktop-accent
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-indigo-500/30
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div
                class="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-desktop-accent to-indigo-400 pointer-events-none"
                style="width: {isMuted ? 0 : volume}%"
              ></div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Clock Widget with Calendar Popup -->
  <div class="calendar-container relative">
    {#if ClockWidget}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div onclick={() => showCalendar = !showCalendar}>
        <ClockWidget />
      </div>
    {/if}

    <!-- Calendar Popup -->
    {#if showCalendar}
      <div class="absolute top-full right-0 mt-2 glass-panel rounded-2xl p-4 w-[min(320px,calc(100vw-2rem))] shadow-2xl animate-slide-down">
        <!-- Calendar Header -->
        <div class="flex items-center justify-between mb-4">
          <button
            onclick={prevMonth}
            aria-label="Previous month"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button
            onclick={goToToday}
            class="text-lg font-semibold text-slate-200 hover:text-desktop-accent transition-colors"
          >
            {monthNames[currentMonth]} {currentYear}
          </button>
          <button
            onclick={nextMonth}
            aria-label="Next month"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Day Names -->
        <div class="grid grid-cols-7 gap-1 mb-2">
          {#each dayNames as day}
            <div class="text-center text-xs font-medium text-slate-500 py-1">
              {day}
            </div>
          {/each}
        </div>

        <!-- Calendar Days -->
        <div class="grid grid-cols-7 gap-1">
          {#each calendarDays as { day, isCurrentMonth, isToday }}
            <button
              class="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all duration-150
                {isToday
                  ? 'bg-desktop-accent text-white font-bold shadow-lg shadow-desktop-accent/30'
                  : isCurrentMonth
                    ? 'text-slate-300 hover:bg-slate-700/50'
                    : 'text-slate-600'
                }"
            >
              {day}
            </button>
          {/each}
        </div>

        <!-- Today Button -->
        <div class="mt-4 pt-3 border-t border-slate-700/50">
          <button
            onclick={goToToday}
            class="w-full py-2 text-sm text-desktop-accent hover:bg-desktop-accent/10 rounded-lg transition-colors font-medium"
          >
            Today - {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Widget Context Menu -->
{#if widgetContextMenu.show}
  <ContextMenu
    items={widgetMenuItems}
    x={widgetContextMenu.x}
    y={widgetContextMenu.y}
    onClose={closeWidgetContextMenu}
  />
{/if}

<style>
  /* Slide down animation for popups */
  @keyframes slide-down {
    0% {
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .animate-slide-down {
    animation: slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  /* Quick toggle hover effect */
  .quick-toggle:hover {
    transform: scale(1.02);
  }

  .quick-toggle:active {
    transform: scale(0.98);
  }

  /* Range slider track styling */
  input[type="range"] {
    position: relative;
    z-index: 2;
  }

  input[type="range"]::-webkit-slider-thumb {
    position: relative;
    z-index: 3;
  }

  /* Tray icon refinements */
  .tray-icon {
    position: relative;
    overflow: hidden;
  }

  .tray-icon::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(var(--desktop-accent-rgb), 0.2) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .tray-icon:hover::before {
    opacity: 1;
  }

  /* Widget container styles */
  .widget-container {
    transition: box-shadow 0.2s ease, transform 0.1s ease;
  }

  .widget-container:hover {
    z-index: 15;
  }

  .widget-container.dragging {
    z-index: 100;
    cursor: grabbing;
    opacity: 0.9;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }
</style>
