// Board state orchestration
import { TaskLogic } from '../core/TaskLogic.js';
import { ColumnLogic } from '../core/ColumnLogic.js';
import { Renderer } from '../ui/Renderer.js';
import { EventHandler } from '../ui/EventHandler.js';
import { DragDropHandler } from '../ui/DragDropHandler.js';
import { IndexedDBService } from '../services/IndexedDBService.js';

export class BoardState {
    constructor() {
        // Initialize modules
        this.renderer = new Renderer();
        this.eventHandler = new EventHandler(this);
        this.dragDropHandler = new DragDropHandler(this);
        this.storage = new IndexedDBService();

        // State - single source of truth
        this.tasks = [];
        this.columns = [];
        this.draggedTask = null;
        this.draggedFromColumn = null;

        // Initialize
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.eventHandler.setupEventListeners();
            this.dragDropHandler.setupDragListeners();
            this.render();
            console.log('✅ Kanban board initialized');
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.renderer.showError('Failed to load board');
        }
    }

    async loadData() {
        try {
            [this.columns, this.tasks] = await Promise.all([
                this.storage.getAllColumns(),
                this.storage.getAllTasks()
            ]);
        } catch (error) {
            console.error('Failed to load data:', error);
            this.columns = [];
            this.tasks = [];
        }
    }

    async addTask(data) {
        const validation = TaskLogic.validateTask(data);
        if (!validation.valid) {
            this.renderer.showError(validation.error);
            return;
        }

        try {
            const newTask = TaskLogic.createTask(data);
            await this.storage.addTask(newTask);
            this.tasks = [...this.tasks, newTask];
            await this.renderer.animateAddTask(newTask);
            this.render();
        } catch (error) {
            console.error('Failed to add task:', error);
            this.renderer.showError('Failed to add task');
        }
    }

    async updateTask(id, updates) {
        try {
            const task = this.tasks.find(t => t.id === id);
            if (!task) return;

            const updatedTask = TaskLogic.updateTask(task, updates);
            await this.storage.updateTask(updatedTask);
            this.tasks = this.tasks.map(t => t.id === id ? updatedTask : t);
            this.render();
        } catch (error) {
            console.error('Failed to update task:', error);
            this.renderer.showError('Failed to update task');
        }
    }

    async deleteTask(id) {
        try {
            await this.renderer.animateRemoveTask(id);
            await this.storage.deleteTask(id);
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.render();
        } catch (error) {
            console.error('Failed to delete task:', error);
            this.renderer.showError('Failed to delete task');
        }
    }

    async moveTask(taskId, newColumnId, newOrder) {
        try {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            const movedTask = TaskLogic.moveTask(task, newColumnId, newOrder);
            await this.storage.updateTask(movedTask);

            const affectedTasks = TaskLogic.reorderTasksInColumn(
                this.tasks.filter(t => t.id !== taskId),
                newColumnId
            );

            this.tasks = this.tasks.map(t => {
                if (t.id === taskId) return movedTask;
                const reordered = affectedTasks.find(at => at.id === t.id);
                return reordered || t;
            });

            await Promise.all(affectedTasks.map(t => this.storage.updateTask(t)));
            this.render();
        } catch (error) {
            console.error('Failed to move task:', error);
            this.renderer.showError('Failed to move task');
        }
    }

    async addColumn(data) {
        const validation = ColumnLogic.validateColumn(data);
        if (!validation.valid) {
            this.renderer.showError(validation.error);
            return;
        }

        try {
            const newColumn = ColumnLogic.createColumn({
                ...data,
                order: this.columns.length
            });
            await this.storage.addColumn(newColumn);
            this.columns = [...this.columns, newColumn];
            this.render();
        } catch (error) {
            console.error('Failed to add column:', error);
            this.renderer.showError('Failed to add column');
        }
    }

    async deleteColumn(id) {
        if (this.columns.length <= 1) {
            this.renderer.showError('Cannot delete the last column');
            return;
        }

        try {
            const firstColumn = ColumnLogic.sortColumns(this.columns)[0];
            const tasksToMove = this.tasks.filter(t => t.columnId === id);

            await Promise.all([
                this.storage.deleteColumn(id),
                ...tasksToMove.map(task =>
                    this.storage.updateTask({ ...task, columnId: firstColumn.id })
                )
            ]);

            this.tasks = this.tasks.map(t =>
                t.columnId === id ? { ...t, columnId: firstColumn.id } : t
            );
            this.columns = this.columns.filter(c => c.id !== id);
            this.render();
        } catch (error) {
            console.error('Failed to delete column:', error);
            this.renderer.showError('Failed to delete column');
        }
    }

    getTasksByColumn(columnId) {
        return TaskLogic.getTasksByColumn(this.tasks, columnId);
    }

    render() {
        const sortedColumns = ColumnLogic.sortColumns(this.columns);
        this.renderer.renderBoard(sortedColumns, this.tasks);
        
        // Setup drag events after render
        this.setupDragEvents();
    }

    setupDragEvents() {
        // Remove old listeners by replacing board container event delegation
        // This is more efficient than tracking individual listeners
        
        const newContainer = this.boardContainer.cloneNode(true);
        this.boardContainer.parentNode.replaceChild(newContainer, this.boardContainer);
        this.boardContainer = newContainer;

        // Delegate drag events
        this.boardContainer.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.task-card');
            if (card) {
                const taskId = parseFloat(card.dataset.taskId);
                const task = this.tasks.find(t => t.id === taskId);
                this.dragDropHandler.onDragStart(e, task);
            }
        });

        this.boardContainer.addEventListener('dragend', (e) => {
            if (e.target.closest('.task-card')) {
                this.dragDropHandler.onDragEnd(e);
            }
        });

        this.boardContainer.addEventListener('dragover', (e) => {
            const columnBody = e.target.closest('.column-body');
            if (columnBody) {
                const columnId = columnBody.dataset.columnId;
                this.dragDropHandler.onDragOver(e, columnId);
            }
        });

        this.boardContainer.addEventListener('dragleave', (e) => {
            if (e.target.closest('.column-body')) {
                this.dragDropHandler.onDragLeave(e);
            }
        });

        this.boardContainer.addEventListener('drop', (e) => {
            const columnBody = e.target.closest('.column-body');
            if (columnBody) {
                const columnId = columnBody.dataset.columnId;
                this.dragDropHandler.onDrop(e, columnId);
            }
        });
    }
}