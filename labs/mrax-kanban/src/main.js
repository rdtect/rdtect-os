// Entry point
import { BoardState } from './state/BoardState.js';

const initApp = () => {
    try {
        console.log('🎮 Initializing Kanban Board...');
        const board = new BoardState();

        if (window.location.hostname === 'localhost' || window.location.hostname === '') {
            window.kanban = board;
            console.log('💡 window.kanban available for debugging');
        }
    } catch (error) {
        console.error('❌ Failed to initialize:', error);
        alert('Failed to load board. Please refresh.');
    }
};

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('DOMContentLoaded', initApp);