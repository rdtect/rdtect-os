// Pure task logic - no side effects
import { PRIORITY_LEVELS } from './constants.js';

export class TaskLogic {
    /**
     * Create a new task
     * @param {Object} data - Task data
     * @returns {Object} - New task
     */
    static createTask(data) {
        return {
            id: Date.now() + Math.random(),
            title: data.title.trim(),
            description: data.description?.trim() || '',
            assignee: data.assignee?.trim() || null,
            priority: data.priority || PRIORITY_LEVELS.MEDIUM,
            columnId: data.columnId,
            startDate: data.startDate || null,
            dueDate: data.dueDate || null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            order: data.order ?? 0
        };
    }

    /**
     * Validate task data
     * @param {Object} data - Task data
     * @returns {Object} - { valid: boolean, error: string }
     */
    static validateTask(data) {
        if (!data.title || data.title.trim().length === 0) {
            return { valid: false, error: 'Title is required' };
        }
        if (data.title.trim().length > 200) {
            return { valid: false, error: 'Title too long (max 200 characters)' };
        }
        if (data.description && data.description.length > 2000) {
            return { valid: false, error: 'Description too long (max 2000 characters)' };
        }
        return { valid: true };
    }

    /**
     * Update task
     * @param {Object} task - Original task
     * @param {Object} updates - Updates to apply
     * @returns {Object} - Updated task
     */
    static updateTask(task, updates) {
        return {
            ...task,
            ...updates,
            updatedAt: Date.now()
        };
    }

    /**
     * Move task to different column
     * @param {Object} task - Task to move
     * @param {string} newColumnId - New column ID
     * @param {number} newOrder - New order in column
     * @returns {Object} - Updated task
     */
    static moveTask(task, newColumnId, newOrder) {
        return {
            ...task,
            columnId: newColumnId,
            order: newOrder,
            updatedAt: Date.now()
        };
    }

    /**
     * Filter tasks by column
     * @param {Array<Object>} tasks - All tasks
     * @param {string} columnId - Column ID
     * @returns {Array<Object>} - Filtered tasks
     */
    static getTasksByColumn(tasks, columnId) {
        return tasks
            .filter(task => task.columnId === columnId)
            .sort((a, b) => a.order - b.order);
    }

    /**
     * Reorder tasks in a column after drag
     * @param {Array<Object>} tasks - All tasks
     * @param {string} columnId - Column ID
     * @returns {Array<Object>} - Reordered tasks
     */
    static reorderTasksInColumn(tasks, columnId) {
        const columnTasks = tasks.filter(t => t.columnId === columnId);
        return columnTasks.map((task, index) => ({
            ...task,
            order: index
        }));
    }

    /**
     * Check if task is overdue
     * @param {Object} task - Task to check
     * @returns {boolean}
     */
    static isOverdue(task) {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < new Date();
    }

    /**
     * Get task statistics
     * @param {Array<Object>} tasks - All tasks
     * @param {Array<Object>} columns - All columns
     * @returns {Object} - Statistics
     */
    static getStatistics(tasks, columns) {
        const stats = {
            total: tasks.length,
            byColumn: {},
            byPriority: {
                low: 0,
                medium: 0,
                high: 0
            },
            overdue: 0
        };

        columns.forEach(column => {
            stats.byColumn[column.id] = tasks.filter(t => t.columnId === column.id).length;
        });

        tasks.forEach(task => {
            stats.byPriority[task.priority]++;
            if (this.isOverdue(task)) stats.overdue++;
        });

        return stats;
    }
}