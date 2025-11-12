// Renderer - DOM updates with animations
import { TaskLogic } from '../core/TaskLogic.js';
import { PRIORITY_COLORS, ANIMATION_DURATION } from '../core/constants.js';
import { escapeHtml, formatDate, getDaysUntil, sleep } from '../core/utils.js';

export class Renderer {
    constructor() {
        this.boardContainer = document.getElementById('board-container');
    }

    renderBoard(columns, tasks) {
        this.boardContainer.innerHTML = '';

        columns.forEach(column => {
            const columnEl = this.createColumnElement(column, tasks);
            this.boardContainer.appendChild(columnEl);
        });

        // Add "+ Column" button at the end
        const addColumnBtn = document.createElement('div');
        addColumnBtn.className = 'add-column-container';
        addColumnBtn.innerHTML = `
            <button class="add-column-btn" id="add-column-btn">
                <span class="plus-icon">+</span>
                <span>Add Column</span>
            </button>
        `;
        this.boardContainer.appendChild(addColumnBtn);
    }

    createColumnElement(column, tasks) {
        const div = document.createElement('div');
        div.className = 'kanban-column';
        div.dataset.columnId = column.id;
        div.style.setProperty('--column-color', column.color);

        const columnTasks = TaskLogic.getTasksByColumn(tasks, column.id);

        div.innerHTML = `
            <div class="column-header">
                <h2 class="column-title">${escapeHtml(column.name)}</h2>
                <span class="task-count">${columnTasks.length}</span>
                <button class="column-delete" data-column-id="${column.id}" title="Delete column" aria-label="Delete column">×</button>
            </div>
            <div class="column-body" data-column-id="${column.id}">
                ${columnTasks.map(task => this.createTaskCard(task)).join('')}
            </div>
            <div class="column-footer">
                <button class="add-task-btn" data-column-id="${column.id}">
                    <span class="plus-icon">+</span>
                    <span>Add Task</span>
                </button>
            </div>
        `;

        return div;
    }

    createTaskCard(task) {
        const isOverdue = TaskLogic.isOverdue(task);
        const daysUntil = getDaysUntil(task.dueDate);

        return `
            <div class="task-card" 
                 draggable="true" 
                 data-task-id="${task.id}"
                 data-priority="${task.priority}">
                <div class="task-header">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <div class="task-priority" style="background: ${PRIORITY_COLORS[task.priority]}"></div>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    ${task.assignee ? `<div class="task-assignee">👤 ${escapeHtml(task.assignee)}</div>` : ''}
                    ${task.dueDate ? `
                        <div class="task-due ${isOverdue ? 'overdue' : ''}">
                            📅 ${formatDate(task.dueDate)}
                            ${daysUntil !== null ? `<span class="days-badge">${daysUntil}d</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                <button class="task-delete" data-task-id="${task.id}" aria-label="Delete task">×</button>
            </div>
        `;
    }

    async animateAddTask(task) {
        this.render();
        await sleep(10);
        const element = document.querySelector(`[data-task-id="${task.id}"]`);
        if (element) {
            element.classList.add('task-entering');
            await sleep(10);
            element.classList.add('task-enter-active');
        }
    }

    async animateRemoveTask(id) {
        const element = document.querySelector(`[data-task-id="${id}"]`);
        if (!element) return;
        element.classList.add('task-leaving');
        await sleep(ANIMATION_DURATION.CARD_REMOVE);
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('toast-show'), 10);
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

}