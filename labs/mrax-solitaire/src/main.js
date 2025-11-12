/**
 * @fileoverview Application entry point
 * Initializes the game when DOM is ready
 */

import { GameState } from './state/GameState.js';

/**
 * Initializes the game
 */
const initGame = () => {
    try {
        const game = new GameState();
        
        
        // Debug mode: expose game globally
        if (location.hostname === 'localhost') {
            window.game = game;
            console.log('Debug mode: window.game available');
            
        }
    } catch (error) {
        console.error('Failed to start game:', error);
        alert('Failed to load game. Please refresh.');
    }
};

// Start when ready
window.addEventListener('DOMContentLoaded', initGame);
