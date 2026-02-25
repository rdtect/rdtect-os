/**
 * Plugin Loader Module
 *
 * Loads and manages different plugin types (native, iframe, web component, federation, wasm).
 * Each plugin type has a specialized loader implementation.
 */

// Main singleton instance
export { PluginLoader, pluginLoader } from './loader';

// Plugin type loaders
export { NativeLoader } from './loaders/native-loader';
export { IframeLoader } from './loaders/iframe-loader';
export { WebComponentLoader } from './loaders/webcomponent-loader';
export { FederationLoader } from './loaders/federation-loader';
export { WasmLoader } from './loaders/wasm-loader';
