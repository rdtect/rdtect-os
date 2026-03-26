// Utility functions

/**
 * Sleep/delay for animations
 * @param {number} ms - Milliseconds
 * @returns {Promise}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Format date to readable string
 * @param {string|number} date - Date
 * @returns {string}
 */
export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Get days until due date
 * @param {string|number} dueDate - Due date
 * @returns {number} - Days remaining (negative if overdue)
 */
export const getDaysUntil = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Escape HTML
 * @param {string} text - Text to escape
 * @returns {string}
 */
export const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * Deep clone array of objects
 * @param {Array} array - Array to clone
 * @returns {Array}
 */
export const deepClone = (array) => array.map(item => ({...item}));

/**
 * Generate unique ID
 * @returns {string}
 */
export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};