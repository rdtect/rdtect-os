/**
 * Entry point for the AI Chat Remote module
 * This file is used by Vite for the development server
 * The actual federation entry is handled by the vite-plugin-federation
 */

// Re-export the Chat component for direct imports during development
export { default as Chat } from './Chat.svelte';
