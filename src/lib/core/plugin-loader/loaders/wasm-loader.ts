/**
 * WASM Loader - Loads WebAssembly module plugins
 *
 * WASM plugins are WebAssembly modules with a Svelte wrapper component
 * for rendering (typically a canvas). The WASM handles computation,
 * the wrapper handles DOM interaction.
 *
 * Supports two modes:
 * 1. Standard WASM - Uses WebAssembly.instantiate directly
 * 2. Go WASM - Requires wasm_exec.js and Go runtime (wrapper handles loading)
 *
 * For Go WASM plugins, the wrapper component is responsible for loading
 * the WASM module because Go requires special setup with wasm_exec.js.
 */
import type { Component } from 'svelte';
import type { PluginManifest, LoadedPlugin, PluginTypeLoader } from '$lib/core/types';

// Generic WASM exports interface
interface WasmExports {
  memory?: WebAssembly.Memory;
  [key: string]: unknown;
}

// Configuration for how WASM should be loaded
interface WasmConfig {
  // If true, the wrapper handles WASM loading (for Go WASM)
  wrapperHandlesLoading?: boolean;
  // Path to wasm_exec.js for Go WASM
  wasmExecPath?: string;
}

export class WasmLoader implements PluginTypeLoader {
  private loadedModules: Map<string, WebAssembly.Instance> = new Map();

  canLoad(manifest: PluginManifest): boolean {
    return manifest.type === 'wasm';
  }

  /**
   * Detect if a WASM module is a Go WASM module
   * Go WASM modules have wasm_exec.js in their build directory
   */
  private detectGoWasm(manifest: PluginManifest): WasmConfig {
    const wasmPath = manifest.wasmModule || '';

    // Check if this looks like a Go WASM setup
    // Go WASM modules typically have wasm_exec.js alongside them
    if (wasmPath.includes('/build/')) {
      const buildDir = wasmPath.substring(0, wasmPath.lastIndexOf('/'));
      return {
        wrapperHandlesLoading: true,
        wasmExecPath: `${buildDir}/wasm_exec.js`
      };
    }

    return {
      wrapperHandlesLoading: false
    };
  }

  async load(manifest: PluginManifest, _basePath?: string): Promise<LoadedPlugin> {
    if (!manifest.wasmModule) {
      throw new Error(`WASM plugin ${manifest.id} must have a wasmModule path`);
    }
    if (!manifest.entry) {
      throw new Error(`WASM plugin ${manifest.id} must have an entry point for the wrapper component`);
    }

    try {
      const wasmConfig = this.detectGoWasm(manifest);

      // Load the wrapper Svelte component
      const wrapperModule = await import(/* @vite-ignore */ manifest.entry);
      const WrapperComponent = wrapperModule.default;

      if (!WrapperComponent) {
        throw new Error(`WASM plugin ${manifest.id} wrapper has no default export`);
      }

      // For Go WASM, the wrapper component handles WASM loading
      // because Go requires wasm_exec.js and special runtime setup
      if (wasmConfig.wrapperHandlesLoading) {
        return {
          manifest,
          type: 'wasm',
          render: {
            kind: 'wasm',
            wrapper: WrapperComponent,
          },
          onDestroy: async () => {
            // Cleanup is handled by the wrapper component
            this.loadedModules.delete(manifest.id);
          },
        };
      }

      // Standard WASM loading (e.g., AssemblyScript, Rust, C)
      let instance = this.loadedModules.get(manifest.id);

      if (!instance) {
        const response = await fetch(manifest.wasmModule);
        const buffer = await response.arrayBuffer();

        // Create import object for WASM
        // This can be extended based on what the WASM module needs
        const importObject = {
          env: {
            // Standard imports that WASM might need
            abort: () => console.error('WASM abort called'),
            log: (ptr: number, len: number) => {
              // Helper for WASM to log strings
              console.log('WASM log:', ptr, len);
            },
            // Memory management helpers
            memory_alloc: (size: number) => {
              // Placeholder - real implementation depends on WASM module
              console.log('WASM memory_alloc:', size);
              return 0;
            },
            memory_free: (ptr: number) => {
              console.log('WASM memory_free:', ptr);
            },
          },
          // JavaScript imports for the WASM module
          js: {
            // Console logging
            console_log: (ptr: number, len: number) => {
              console.log('WASM:', ptr, len);
            },
            // Performance timing
            performance_now: () => performance.now(),
          },
          // Additional imports can be added here
        };

        const result = await WebAssembly.instantiate(buffer, importObject);
        instance = result.instance;
        this.loadedModules.set(manifest.id, instance);
      }

      // Create a wrapper that passes WASM exports to the component
      const wasmExports = instance.exports as WasmExports;

      // Extend the wrapper component with WASM exports
      // This allows the wrapper to access WASM functions
      const WrapperWithWasm = class extends WrapperComponent {
        static wasmExports = wasmExports;
        static wasmInstance = instance;
      };

      return {
        manifest,
        type: 'wasm',
        render: {
          kind: 'wasm',
          wrapper: WrapperWithWasm as unknown as Component,
        },
        onDestroy: async () => {
          // Clean up WASM instance
          this.loadedModules.delete(manifest.id);
        },
      };
    } catch (error) {
      throw new Error(`Failed to load WASM plugin ${manifest.id}: ${error}`);
    }
  }

  async unload(plugin: LoadedPlugin): Promise<void> {
    this.loadedModules.delete(plugin.manifest.id);
  }

  /**
   * Helper to load Go WASM runtime
   * This is provided as a utility for wrapper components that need it
   */
  static async loadGoRuntime(wasmExecPath: string): Promise<void> {
    // Check if already loaded
    if ((window as any).Go) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = wasmExecPath;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${wasmExecPath}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Helper to instantiate and run a Go WASM module
   * Returns a promise that resolves when the Go WASM is ready
   */
  static async instantiateGoWasm(
    wasmPath: string,
    wasmExecPath: string
  ): Promise<WebAssembly.Instance> {
    // Load the Go runtime first
    await WasmLoader.loadGoRuntime(wasmExecPath);

    // Create Go instance
    const go = new (window as any).Go();

    // Fetch and instantiate the WASM module
    const result = await WebAssembly.instantiateStreaming(
      fetch(wasmPath),
      go.importObject
    );

    // Run the Go program (non-blocking, runs in background)
    go.run(result.instance);

    return result.instance;
  }
}
