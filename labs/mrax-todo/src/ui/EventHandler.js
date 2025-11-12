// Event handler - user interactions
import { FILTER_TYPE } from '../core/constants.js';

export class EventHandler {
    constructor(todoState) {
        this.state = todoState;
        this.todoInput = document.getElementById('todo-input');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Add todo
        document.getElementById('add-btn').addEventListener('click', () => {
            this.handleAddTodo();
        });

        // Add on Enter key
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddTodo();
            }
        });

        // Filter buttons
        document.getElementById('filter-all').addEventListener('click', () => {
            this.state.setFilter(FILTER_TYPE.ALL);
        });

        document.getElementById('filter-active').addEventListener('click', () => {
            this.state.setFilter(FILTER_TYPE.ACTIVE);
        });

        document.getElementById('filter-completed').addEventListener('click', () => {
            this.state.setFilter(FILTER_TYPE.COMPLETED);
        });

        // Clear completed
        document.getElementById('clear-completed').addEventListener('click', () => {
            this.state.clearCompleted();
        });

        // Delegate todo item events
        document.getElementById('todo-list').addEventListener('click', (e) => {
            this.handleTodoClick(e);
        });

        // Delegate checkbox changes
        document.getElementById('todo-list').addEventListener('change', (e) => {
            this.handleTodoToggle(e);
        });
    }

    /**
     * Handle add todo
     */
    handleAddTodo() {
        const text = this.todoInput.value;
        this.state.addTodo(text);
    }

    /**
     * Handle todo item click (delete button)
     * @param {Event} e - Click event
     */
    handleTodoClick(e) {
        const deleteBtn = e.target.closest('.todo-delete');
        if (deleteBtn) {
            const todoItem = deleteBtn.closest('.todo-item');
            const id = parseFloat(todoItem.dataset.id);
            this.state.deleteTodo(id);
        }
    }

    /**
     * Handle todo toggle
     * @param {Event} e - Change event
     */
    handleTodoToggle(e) {
        if (e.target.type === 'checkbox') {
            const todoItem = e.target.closest('.todo-item');
            const id = parseFloat(todoItem.dataset.id);
            this.state.toggleTodo(id);
        }
    }

    /**
     * Clear input field
     */
    clearInput() {
        this.todoInput.value = '';
        this.todoInput.focus();
    }
}