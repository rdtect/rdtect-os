// MRX Tic-Tac-Toe - Svelte Web Version

// MODEL - Pure business logic
export * from './game.model';

// EVENTS - DOM to Domain translation
export * from './game.events';

// EFFECTS - Side effects (sounds, animations)
export * from './game.effects';

// HANDLERS - Bridge Model and Experience
export * from './game.handlers';

// UI COMPONENTS
export { default as Game } from './Game.svelte';
export { default as Board } from './Board.svelte';
export { default as Cell } from './Cell.svelte';
export { default as Status } from './Status.svelte';
