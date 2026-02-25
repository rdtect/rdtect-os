<script lang="ts">
  import { onMount, onDestroy, type Component } from "svelte";
  import { Desktop, wm } from "$lib/shell";
  import { pluginLoader } from "$lib/core/plugin-loader";
  import { widgetRegistry } from "$lib/core/widget-registry.svelte";
  import { initVirtualFilesystems } from "$lib/core/vfs";
  import { startFileHandler, stopFileHandler } from "$lib/core/file-associations";
  import { agentRuntime } from "$lib/core/agents/runtime.svelte";
  import type { PluginManifest, LoadedPlugin } from "$lib/core/types";

  /**
   * rdtect OS - Main Entry Point
   *
   * Dynamically discovers and loads all plugins from the /plugins directory.
   * No more legacy imports - everything is loaded dynamically.
   */

  let pluginsLoaded = $state(false);
  let loadedCount = $state(0);
  let errorCount = $state(0);

  // Glob import for all plugin manifests (as TypeScript modules)
  const manifestModules = import.meta.glob<{ default: PluginManifest }>(
    "/plugins/*/manifest.ts",
    { eager: true }
  );

  // Glob import for all widget components (lazy loaded)
  const widgetModules = import.meta.glob<{ default: Component }>(
    "/plugins/*/src/*Widget.svelte"
  );

  // Discover and load plugins on mount
  onMount(async () => {
    console.log("[rdtect OS] Starting plugin discovery...");

    // Initialize virtual filesystems with reactive providers
    initVirtualFilesystems(wm, agentRuntime);

    // Start the file handler for file:open events
    startFileHandler();

    // Process each discovered manifest
    for (const [path, module] of Object.entries(manifestModules)) {
      try {
        const manifest = module.default;
        // Extract base path: /plugins/clock/manifest.ts -> /plugins/clock
        const basePath = path.replace("/manifest.ts", "");

        const success = await loadAndRegisterPlugin(manifest, basePath);
        if (success) {
          loadedCount++;
        }
      } catch (error) {
        console.error(`[rdtect OS] Failed to load plugin from ${path}:`, error);
        errorCount++;
      }
    }

    pluginsLoaded = true;
    console.log(
      `[rdtect OS] Loaded ${loadedCount} plugins, ${errorCount} errors`
    );
  });

  // Cleanup on unmount
  onDestroy(() => {
    stopFileHandler();
  });

  /**
   * Load a plugin and register it with the Window Manager
   */
  async function loadAndRegisterPlugin(
    manifest: PluginManifest,
    basePath: string
  ): Promise<boolean> {
    try {
      // Skip plugins that are already registered (prevents duplicates)
      if (wm.apps.some((app) => app.id === manifest.id)) {
        console.log(`[rdtect OS] Plugin ${manifest.id} already registered, skipping`);
        return false;
      }

      // Load the plugin using the appropriate loader
      const plugin = await pluginLoader.load(manifest, basePath);

      // Register with the Window Manager
      wm.registerApp({
        id: manifest.id,
        title: manifest.name,
        icon: manifest.icon,
        pluginType: manifest.type,
        type: getAppType(plugin),
        component: getComponent(plugin) as Component,
        url: getUrl(plugin),
        singleton: manifest.singleton,
        resizable: manifest.resizable ?? true,
        defaultWidth: manifest.defaultWidth ?? 600,
        defaultHeight: manifest.defaultHeight ?? 400,
        minWidth: manifest.minWidth ?? 300,
        minHeight: manifest.minHeight ?? 200,
        plugin,
      });

      // If plugin has a widget, load and register it
      if (manifest.widget) {
        await loadAndRegisterWidget(manifest, basePath);
      }

      console.log(`[rdtect OS] Registered plugin: ${manifest.name}`);
      return true;
    } catch (error) {
      console.error(`[rdtect OS] Failed to load plugin ${manifest.id}:`, error);
      return false;
    }
  }

  /**
   * Load and register a widget for a plugin
   */
  async function loadAndRegisterWidget(
    manifest: PluginManifest,
    basePath: string
  ): Promise<void> {
    if (!manifest.widget) return;

    try {
      // Construct the full widget path
      const widgetPath = `${basePath}/${manifest.widget}`;

      // Find the matching widget module
      const widgetLoader = widgetModules[widgetPath];

      if (!widgetLoader) {
        console.warn(`[rdtect OS] Widget not found for ${manifest.id}: ${widgetPath}`);
        return;
      }

      // Load the widget component
      const widgetModule = await widgetLoader();
      const widgetComponent = widgetModule.default;

      if (!widgetComponent) {
        console.warn(`[rdtect OS] Widget component has no default export: ${widgetPath}`);
        return;
      }

      // Register with widget registry
      widgetRegistry.register(manifest.id, widgetComponent, {
        width: manifest.widgetWidth ?? 200,
        height: manifest.widgetHeight ?? 100,
        name: manifest.name,
        icon: manifest.icon,
        defaultX: 16,
        defaultY: 16 + (widgetRegistry.widgets.length * 120)
      });

      console.log(`[rdtect OS] Registered widget for plugin: ${manifest.name}`);
    } catch (error) {
      console.error(`[rdtect OS] Failed to load widget for ${manifest.id}:`, error);
    }
  }

  /**
   * Get the app type from a loaded plugin
   */
  function getAppType(plugin: LoadedPlugin): "component" | "iframe" {
    if (plugin.render.kind === "iframe") return "iframe";
    return "component";
  }

  /**
   * Get the component from a loaded plugin (for component-based plugins)
   */
  function getComponent(plugin: LoadedPlugin): unknown {
    if (plugin.render.kind === "component") return plugin.render.component;
    if (plugin.render.kind === "federation") return plugin.render.component;
    if (plugin.render.kind === "wasm") return plugin.render.wrapper;
    return undefined;
  }

  /**
   * Get the URL from a loaded plugin (for iframe plugins)
   */
  function getUrl(plugin: LoadedPlugin): string | undefined {
    if (plugin.render.kind === "iframe") return plugin.render.url;
    return undefined;
  }
</script>

<svelte:head>
  <title>rdtect OS</title>
</svelte:head>

<Desktop />
