// Todo state orchestration
import { TodoLogic } from '../core/TodoLogic.js';
import { Renderer } from '../ui/Renderer.js';
import { EventHandler } from '../ui/EventHandler.js';
import { IndexedDBService } from '../services/IndexedDBService.js';
import { FILTER_TYPE } from '../core/constants.js';
import { deepCloneArray } from '../core/utils.js';

export class TodoState {
    constructor() {
        // Initialize modules
        this.renderer = new Renderer();
        this.eventHandler = new EventHandler(this);
        this.storage = new IndexedDBService();
        
        // State - single source of truth
        this.todos = [];
        this.currentFilter = FILTER_TYPE.ALL;
        
        // Initialize
        this.init();
    }

    /**
     * Initialize app - load from storage and render
     */
    async init() {
        try {
            // Setup event listeners
            this.eventHandler.setupEventListeners();
            
            // Load todos from IndexedDB
            await this.loadTodos();
            
            // Initial render
            this.render();
            
            console.log('✅ Todo app initialized');
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.renderer.showError('Failed to load todos. Please refresh.');
        }
    }

    /**
     * Load todos from storage
     */
    async loadTodos() {
        try {
            this.todos = await this.storage.getAllTodos();
        } catch (error) {
            console.error('Failed to load todos:', error);
            this.todos = [];
        }
    }

    /**
     * Add a new todo
     * @param {string} text - Todo text
     */
    async addTodo(text) {
        // Validate
        if (!TodoLogic.isValidTodoText(text)) {
            this.renderer.showError('Please enter valid todo text (1-500 characters)');
            return;
        }

        try {
            // Create todo
            const newTodo = TodoLogic.createTodo(text);
            
            // Save to storage
            await this.storage.addTodo(newTodo);
            
            // Update state
            this.todos = [...this.todos, newTodo];
            
            // Render with animation
            await this.renderer.animateAddTodo(newTodo, this.getFilteredTodos());
            this.renderStats();
            
            // Clear input
            this.eventHandler.clearInput();
        } catch (error) {
            console.error('Failed to add todo:', error);
            this.renderer.showError('Failed to add todo. Please try again.');
        }
    }

    /**
     * Toggle todo status
     * @param {number} id - Todo ID
     */
    async toggleTodo(id) {
        try {
            const todo = this.todos.find(t => t.id === id);
            if (!todo) return;

            // Update todo
            const updatedTodo = TodoLogic.toggleTodo(todo);
            
            // Save to storage
            await this.storage.updateTodo(updatedTodo);
            
            // Update state
            this.todos = this.todos.map(t => 
                t.id === id ? updatedTodo : t
            );
            
            // Render
            this.render();
        } catch (error) {
            console.error('Failed to toggle todo:', error);
            this.renderer.showError('Failed to update todo.');
        }
    }

    /**
     * Delete a todo
     * @param {number} id - Todo ID
     */
    async deleteTodo(id) {
        try {
            // Animate removal
            await this.renderer.animateRemoveTodo(id);
            
            // Delete from storage
            await this.storage.deleteTodo(id);
            
            // Update state
            this.todos = this.todos.filter(t => t.id !== id);
            
            // Render
            this.render();
        } catch (error) {
            console.error('Failed to delete todo:', error);
            this.renderer.showError('Failed to delete todo.');
        }
    }

    /**
     * Update todo text
     * @param {number} id - Todo ID
     * @param {string} newText - New text
     */
    async updateTodoText(id, newText) {
        if (!TodoLogic.isValidTodoText(newText)) {
            this.renderer.showError('Invalid todo text');
            return;
        }

        try {
            const todo = this.todos.find(t => t.id === id);
            if (!todo) return;

            // Update todo
            const updatedTodo = TodoLogic.updateTodoText(todo, newText);
            
            // Save to storage
            await this.storage.updateTodo(updatedTodo);
            
            // Update state
            this.todos = this.todos.map(t => 
                t.id === id ? updatedTodo : t
            );
            
            // Render
            this.render();
        } catch (error) {
            console.error('Failed to update todo:', error);
            this.renderer.showError('Failed to update todo.');
        }
    }

    /**
     * Clear completed todos
     */
    async clearCompleted() {
        try {
            const completedIds = this.todos
                .filter(t => t.status === 'completed')
                .map(t => t.id);

            if (completedIds.length === 0) return;

            // Animate all removals
            await Promise.all(
                completedIds.map(id => this.renderer.animateRemoveTodo(id))
            );

            // Delete from storage
            await Promise.all(
                completedIds.map(id => this.storage.deleteTodo(id))
            );
            
            // Update state
            this.todos = this.todos.filter(t => t.status !== 'completed');
            
            // Render
            this.render();
        } catch (error) {
            console.error('Failed to clear completed:', error);
            this.renderer.showError('Failed to clear completed todos.');
        }
    }

    /**
     * Set filter
     * @param {string} filterType - Filter type
     */
    setFilter(filterType) {
        this.currentFilter = filterType;
        this.render();
    }

    /**
     * Get filtered todos
     * @returns {Array<Object>}
     */
    getFilteredTodos() {
        const filtered = TodoLogic.filterTodos(this.todos, this.currentFilter);
        return TodoLogic.sortTodos(filtered);
    }

    /**
     * Render entire app
     */
    render() {
        const filteredTodos = this.getFilteredTodos();
        this.renderer.renderTodos(filteredTodos);
        this.renderStats();
        this.renderer.updateFilterButtons(this.currentFilter);
    }

    /**
     * Render statistics
     */
    renderStats() {
        const stats = TodoLogic.getStats(this.todos);
        this.renderer.renderStats(stats);
    }
}