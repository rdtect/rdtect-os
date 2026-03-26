// Renderer - updates DOM with animations
import { TODO_STATUS, ANIMATION_DURATION } from '../core/constants.js';
import { sleep, formatDate } from '../core/utils.js';

export class Renderer {
    constructor() {
        this.todoList = document.getElementById('todo-list');
        this.statsTotal = document.getElementById('stats-total');
        this.statsActive = document.getElementById('stats-active');
        this.statsCompleted = document.getElementById('stats-completed');
    }

    /**
     * Render all todos
     * @param {Array<Object>} todos - Todos to render
     */
    renderTodos(todos) {
        this.todoList.innerHTML = '';
        
        if (todos.length === 0) {
            this.renderEmptyState();
            return;
        }

        todos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            this.todoList.appendChild(todoElement);
        });
    }

    /**
     * Create a todo DOM element
     * @param {Object} todo - Todo object
     * @returns {HTMLElement}
     */
    createTodoElement(todo) {
        const div = document.createElement('div');
        div.className = `todo-item ${todo.status === TODO_STATUS.COMPLETED ? 'completed' : ''}`;
        div.dataset.id = todo.id;
        
        div.innerHTML = `
            <div class="todo-checkbox">
                <input type="checkbox" 
                       id="todo-${todo.id}" 
                       ${todo.status === TODO_STATUS.COMPLETED ? 'checked' : ''}>
                <label for="todo-${todo.id}">
                    <svg class="check-icon" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"></path>
                    </svg>
                </label>
            </div>
            <div class="todo-content">
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <span class="todo-date">${formatDate(todo.createdAt)}</span>
            </div>
            <button class="todo-delete" aria-label="Delete todo">
                <svg viewBox="0 0 24 24">
                    <path d="M6 6l12 12M18 6L6 18"></path>
                </svg>
            </button>
        `;
        
        return div;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        this.todoList.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
                <p>No todos yet!</p>
                <p class="empty-subtitle">Add one above to get started</p>
            </div>
        `;
    }

    /**
     * Animate adding a todo
     * @param {Object} todo - New todo
     * @param {Array<Object>} allTodos - All filtered todos
     */
    async animateAddTodo(todo, allTodos) {
        // Re-render all todos
        this.renderTodos(allTodos);
        
        // Find the new element and animate it
        const element = this.todoList.querySelector(`[data-id="${todo.id}"]`);
        if (element) {
            element.classList.add('todo-entering');
            await sleep(10); // Force reflow
            element.classList.remove('todo-entering');
            element.classList.add('todo-enter-active');
        }
    }

    /**
     * Animate removing a todo
     * @param {number} id - Todo ID
     */
    async animateRemoveTodo(id) {
        const element = this.todoList.querySelector(`[data-id="${id}"]`);
        if (!element) return;

        element.classList.add('todo-leaving');
        await sleep(ANIMATION_DURATION.FADE_OUT);
    }

    /**
     * Render statistics
     * @param {Object} stats - Stats object
     */
    renderStats(stats) {
        this.statsTotal.textContent = `${stats.total} total`;
        this.statsActive.textContent = `${stats.active} active`;
        this.statsCompleted.textContent = `${stats.completed} completed`;
    }

    /**
     * Update filter buttons
     * @param {string} currentFilter - Current filter
     */
    updateFilterButtons(currentFilter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeButton = document.getElementById(`filter-${currentFilter}`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('toast-show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}