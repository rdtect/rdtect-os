<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { clickOutside, escapeKey } from '$lib/core/attachments';
  import type { MenuItem } from './types';

  interface Props {
    items: MenuItem[];
    x: number;
    y: number;
    onClose: () => void;
    isSubmenu?: boolean;
  }

  let { items, x, y, onClose, isSubmenu = false }: Props = $props();

  let menuEl: HTMLDivElement;

  // Position adjustment to keep menu in viewport
  let adjustedX = $state(0);
  let adjustedY = $state(0);

  // Active submenu state
  let activeSubmenu = $state<{ item: MenuItem; x: number; y: number } | null>(null);
  let submenuTimeout: ReturnType<typeof setTimeout> | null = null;

  // Update positions reactively when x/y props change
  $effect(() => {
    adjustedX = x;
    adjustedY = y;
  });

  onMount(async () => {
    await tick();
    // Adjust position if menu would go off-screen
    const rect = menuEl.getBoundingClientRect();
    const padding = 8;

    if (x + rect.width > window.innerWidth - padding) {
      adjustedX = isSubmenu ? x - rect.width : window.innerWidth - rect.width - padding;
    }
    if (y + rect.height > window.innerHeight - 56 - padding) { // Account for taskbar
      adjustedY = window.innerHeight - 56 - rect.height - padding;
    }
  });

  // Svelte 5 Attachments for click outside and escape key
  const handleClickOutside = $derived(
    clickOutside({
      onClickOutside: () => {
        if (!isSubmenu) onClose();
      }
    })
  );

  const handleEscapeKey = $derived(
    escapeKey({
      onEscape: () => onClose()
    })
  );

  function handleItemClick(item: MenuItem) {
    if (item.disabled || item.separator || item.submenu) return;
    item.action?.();
    onClose();
  }

  function handleSubmenuEnter(e: MouseEvent, item: MenuItem, index: number) {
    if (!item.submenu) {
      // Clear submenu when hovering non-submenu item
      if (submenuTimeout) clearTimeout(submenuTimeout);
      submenuTimeout = setTimeout(() => {
        activeSubmenu = null;
      }, 100);
      return;
    }

    // Clear any pending close
    if (submenuTimeout) clearTimeout(submenuTimeout);

    // Get the menu item element position
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const menuRect = menuEl.getBoundingClientRect();

    // Position submenu to the right of the item
    const submenuX = menuRect.right - 4;
    const submenuY = rect.top - 8;

    submenuTimeout = setTimeout(() => {
      activeSubmenu = { item, x: submenuX, y: submenuY };
    }, 150);
  }

  function handleSubmenuLeave() {
    if (submenuTimeout) clearTimeout(submenuTimeout);
    submenuTimeout = setTimeout(() => {
      activeSubmenu = null;
    }, 200);
  }

  function handleSubmenuStay() {
    if (submenuTimeout) clearTimeout(submenuTimeout);
  }

  function closeSubmenu() {
    activeSubmenu = null;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={menuEl}
  class="context-menu fixed min-w-[180px] p-1.5 z-[10000]"
  class:submenu={isSubmenu}
  style:left="{adjustedX}px"
  style:top="{adjustedY}px"
  {@attach handleClickOutside}
  {@attach handleEscapeKey}
  onmouseleave={handleSubmenuLeave}
>
  {#each items as item, index}
    {#if item.separator}
      <div class="menu-separator h-px mx-2 my-1.5"></div>
    {:else}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="menu-item flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer text-[13px]
          {item.disabled ? 'menu-item-disabled' : ''}
          {item.submenu ? 'has-submenu' : ''}
          {activeSubmenu?.item === item ? 'submenu-active' : ''}"
        style="--item-index: {index}"
        onclick={() => handleItemClick(item)}
        onmouseenter={(e) => handleSubmenuEnter(e, item, index)}
        role="menuitem"
        tabindex={item.disabled ? -1 : 0}
      >
        <!-- Checkbox/Radio indicator -->
        {#if item.checked !== undefined}
          <span class="menu-check w-4 text-center text-desktop-accent">
            {#if item.checked}
              <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
          </span>
        {:else if item.icon}
          <span class="menu-icon w-4 text-center">{item.icon}</span>
        {:else}
          <span class="menu-icon w-4"></span>
        {/if}
        <span class="menu-label flex-1">{item.label}</span>
        {#if item.shortcut}
          <span class="menu-shortcut text-[11px] text-slate-500 ml-4">{item.shortcut}</span>
        {/if}
        {#if item.submenu}
          <span class="menu-arrow text-slate-400">
            <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </span>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<!-- Render active submenu -->
{#if activeSubmenu}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onmouseenter={handleSubmenuStay}
    onmouseleave={handleSubmenuLeave}
  >
    <svelte:self
      items={activeSubmenu.item.submenu ?? []}
      x={activeSubmenu.x}
      y={activeSubmenu.y}
      onClose={onClose}
      isSubmenu={true}
    />
  </div>
{/if}

<style>
  /* Context Menu Container - Enhanced Glass Effect */
  .context-menu {
    background: linear-gradient(180deg,
      rgba(30, 41, 59, 0.95) 0%,
      rgba(15, 23, 42, 0.92) 100%
    );
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-radius: 12px;
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.45),
      0 4px 12px rgba(0, 0, 0, 0.25),
      inset 0 1px 1px rgba(255, 255, 255, 0.06),
      inset 0 -1px 1px rgba(0, 0, 0, 0.08);
    animation: menu-appear 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transform-origin: top left;
  }

  @keyframes menu-appear {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Subtle top highlight */
  .context-menu::before {
    content: '';
    position: absolute;
    top: 0;
    left: 8px;
    right: 8px;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 30%,
      rgba(255, 255, 255, 0.1) 70%,
      transparent 100%
    );
    pointer-events: none;
  }

  /* Menu Separator */
  .menu-separator {
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(148, 163, 184, 0.2) 15%,
      rgba(148, 163, 184, 0.2) 85%,
      transparent 100%
    );
  }

  /* Menu Item Base Styles */
  .menu-item {
    color: rgb(226, 232, 240);
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      transform 0.15s ease,
      box-shadow 0.15s ease;
    position: relative;
    animation: item-appear 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: calc(var(--item-index, 0) * 0.025s);
    opacity: 0;
  }

  @keyframes item-appear {
    from {
      opacity: 0;
      transform: translateX(-4px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .menu-item:hover:not(.menu-item-disabled) {
    background: linear-gradient(90deg,
      rgba(99, 102, 241, 0.2) 0%,
      rgba(99, 102, 241, 0.15) 100%
    );
    color: rgb(255, 255, 255);
    transform: translateX(2px);
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.1);
  }

  .menu-item:active:not(.menu-item-disabled) {
    transform: scale(0.98);
    transition-duration: 0.08s;
  }

  .menu-item:focus-visible {
    outline: none;
    background: linear-gradient(90deg,
      rgba(99, 102, 241, 0.25) 0%,
      rgba(99, 102, 241, 0.18) 100%
    );
    box-shadow: inset 0 0 0 2px rgba(99, 102, 241, 0.4);
  }

  /* Disabled Item Styles */
  .menu-item-disabled {
    color: rgb(100, 116, 139);
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Menu Icon */
  .menu-icon {
    font-size: 14px;
    transition: transform 0.15s ease;
  }

  .menu-item:hover:not(.menu-item-disabled) .menu-icon {
    transform: scale(1.15);
  }

  /* Menu Label */
  .menu-label {
    font-weight: 450;
    letter-spacing: 0.01em;
  }

  /* Hover indicator line */
  .menu-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg,
      rgb(99, 102, 241) 0%,
      rgb(139, 92, 246) 100%
    );
    border-radius: 0 2px 2px 0;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .menu-item:hover:not(.menu-item-disabled)::before {
    transform: translateY(-50%) scaleY(1);
  }

  /* Submenu indicator */
  .has-submenu {
    padding-right: 8px;
  }

  .has-submenu:hover .menu-arrow,
  .submenu-active .menu-arrow {
    color: rgb(165, 180, 252);
  }

  /* Active submenu state */
  .submenu-active {
    background: linear-gradient(90deg,
      rgba(99, 102, 241, 0.2) 0%,
      rgba(99, 102, 241, 0.15) 100%
    );
    color: rgb(255, 255, 255);
  }

  .submenu-active::before {
    transform: translateY(-50%) scaleY(1);
  }

  /* Submenu container animation */
  .submenu {
    animation: submenu-appear 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes submenu-appear {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Menu check icon */
  .menu-check {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Menu arrow for submenus */
  .menu-arrow {
    display: flex;
    align-items: center;
    transition: color 0.15s ease, transform 0.15s ease;
  }

  .menu-item:hover:not(.menu-item-disabled) .menu-arrow {
    transform: translateX(2px);
  }

  /* Shortcut styling */
  .menu-shortcut {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
</style>
