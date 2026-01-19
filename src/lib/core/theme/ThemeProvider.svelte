<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { theme } from './theme.svelte';

  /**
   * ThemeProvider Component
   *
   * Applies CSS custom properties to the document root based on the active theme.
   * Should be placed at the root of your application.
   *
   * Features:
   * - Applies CSS variables to :root
   * - Initializes theme store (loads preference, detects system theme)
   * - Adds theme class to document for additional styling hooks
   */

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  let initialized = $state(false);

  onMount(() => {
    // Initialize the theme store (client-side only)
    theme.initialize();
    initialized = true;
  });

  // Apply CSS variables reactively
  $effect(() => {
    if (typeof document === 'undefined' || !initialized) return;

    const root = document.documentElement;
    const variables = theme.cssVariables;

    // Apply all CSS custom properties
    for (const [property, value] of Object.entries(variables)) {
      root.style.setProperty(property, value);
    }

    // Add theme class for additional styling hooks
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(`theme-${theme.activeThemeId}`);

    // Set color-scheme for native UI elements
    root.style.colorScheme = theme.activeThemeId === 'light' ? 'light' : 'dark';
  });

  // Apply background color to body
  $effect(() => {
    if (typeof document === 'undefined' || !initialized) return;

    document.body.style.backgroundColor = theme.activeTheme.colors.bgPrimary;
    document.body.style.color = theme.activeTheme.colors.textPrimary;
  });
</script>

<!--
  The ThemeProvider is a wrapper component that doesn't render any visible elements.
  It only manages the theme state and applies CSS variables.
  Children are rendered via the default slot.
-->
{#if children}
  {@render children()}
{/if}
