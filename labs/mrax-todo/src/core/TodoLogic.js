// Pure todo logic - no side effects, no DOM, no storage
import { TODO_STATUS, FILTER_TYPE } from './constants.js';

export class TodoLogic {
    /**
     * Create a new todo item
     * @param {string} text - Todo text
     * @returns {Object} - New todo object
     */
    static createTodo(text) {
        return {
            id: Date.now() + Math.random(), // Simple unique ID
            text: text.trim(),
            status: TODO_STATUS.ACTIVE,
            createdAt: Date.now(),
            completedAt: null
        };
    }

    /**
     * Validate todo text
     * @param {string} text - Text to validate
     * @returns {boolean} - True if valid
     */
    static isValidTodoText(text) {
        return text && text.trim().length > 0 && text.trim().length <= 500;
    }

    /**
     * Toggle todo status
     * @param {Object} todo - Todo to toggle
     * @returns {Object} - Updated todo
     */
    static toggleTodo(todo) {
        return {
            ...todo,
            status: todo.status === TODO_STATUS.ACTIVE 
                ? TODO_STATUS.COMPLETED 
                : TODO_STATUS.ACTIVE,
            completedAt: todo.status === TODO_STATUS.ACTIVE 
                ? Date.now() 
                : null
        };
    }

    /**
     * Update todo text
     * @param {Object} todo - Todo to update
     * @param {string} newText - New text
     * @returns {Object} - Updated todo
     */
    static updateTodoText(todo, newText) {
        return {
            ...todo,
            text: newText.trim()
        };
    }

    /**
     * Filter todos by type
     * @param {Array<Object>} todos - All todos
     * @param {string} filterType - Filter type
     * @returns {Array<Object>} - Filtered todos
     */
    static filterTodos(todos, filterType) {
        switch (filterType) {
            case FILTER_TYPE.ACTIVE:
                return todos.filter(todo => todo.status === TODO_STATUS.ACTIVE);
            case FILTER_TYPE.COMPLETED:
                return todos.filter(todo => todo.status === TODO_STATUS.COMPLETED);
            default:
                return todos;
        }
    }

    /**
     * Get statistics
     * @param {Array<Object>} todos - All todos
     * @returns {Object} - Statistics
     */
    static getStats(todos) {
        return {
            total: todos.length,
            active: todos.filter(t => t.status === TODO_STATUS.ACTIVE).length,
            completed: todos.filter(t => t.status === TODO_STATUS.COMPLETED).length
        };
    }

    /**
     * Sort todos - active first, then by creation date
     * @param {Array<Object>} todos - Todos to sort
     * @returns {Array<Object>} - Sorted todos
     */
    static sortTodos(todos) {
        return [...todos].sort((a, b) => {
            // Active todos first
            if (a.status !== b.status) {
                return a.status === TODO_STATUS.ACTIVE ? -1 : 1;
            }
            // Then by creation date (newest first)
            return b.createdAt - a.createdAt;
        });
    }
}