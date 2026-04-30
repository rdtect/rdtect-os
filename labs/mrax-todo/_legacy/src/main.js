// Entry point with error handling
import { TodoState } from './state/TodoState.js';

const initApp = () => {
    try {
        console.log('🎮 Initializing Todo App...');
        const app = new TodoState();
        
        // Debug mode - expose to window
        if (window.location.hostname === 'localhost' || window.location.hostname === '') {
            window.todoApp = app;
            console.log('💡 window.todoApp available for debugging');
        }
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        alert('Failed to load app. Please refresh the page.');
    }
};

// Global error handlers
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', initApp);