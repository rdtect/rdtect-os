// Event handler - user interactions
export class EventHandler {
    constructor(boardState) {
        this.board = boardState;
        this.currentEditingTask = null;
        this.currentColumnId = null;
        this.boardContainer = document.getElementById('board-container');
    }

    setupEventListeners() {
        // Delegate add task buttons (in columns)
        this.boardContainer.addEventListener('click', (e) => {
            const addTaskBtn = e.target.closest('.add-task-btn');
            if (addTaskBtn) {
                const columnId = addTaskBtn.dataset.columnId;
                this.openTaskModal(null, columnId);
            }

            // Add column button
            const addColumnBtn = e.target.closest('#add-column-btn');
            if (addColumnBtn) {
                this.openColumnModal();
            }

            // Delete column button
            const deleteColumnBtn = e.target.closest('.column-delete');
            if (deleteColumnBtn) {
                const columnId = deleteColumnBtn.dataset.columnId;
                if (confirm('Delete this column? Tasks will be moved to the first column.')) {
                    this.board.deleteColumn(columnId);
                }
            }

            // Task card click to edit
            const taskCard = e.target.closest('.task-card');
            if (taskCard && !e.target.closest('.task-delete')) {
                const taskId = parseFloat(taskCard.dataset.taskId);
                const task = this.board.tasks.find(t => t.id === taskId);
                if (task) {
                    this.openTaskModal(task);
                }
            }

            // Delete task button
            const deleteBtn = e.target.closest('.task-delete');
            if (deleteBtn) {
                const taskId = parseFloat(deleteBtn.dataset.taskId);
                this.board.deleteTask(taskId);
            }
        });

        // Task modal
        document.getElementById('save-task-btn').addEventListener('click', () => {
            this.saveTask();
        });

        document.getElementById('cancel-task-btn').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // Column modal
        document.getElementById('save-column-btn').addEventListener('click', () => {
            this.saveColumn();
        });

        document.getElementById('cancel-column-btn').addEventListener('click', () => {
            this.closeColumnModal();
        });

        // Close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('modal-open');
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('modal-open');
                }
            });
        });

    }

    openTaskModal(task = null, columnId = null) {
        this.currentEditingTask = task;
        this.currentColumnId = columnId;
        const modal = document.getElementById('task-modal');

        if (task) {
            document.getElementById('modal-title').textContent = 'Edit Task';
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-assignee').value = task.assignee || '';
            document.getElementById('task-start-date').value = task.startDate || '';
            document.getElementById('task-due-date').value = task.dueDate || '';
            document.getElementById('task-priority').value = task.priority;
        } else {
            document.getElementById('modal-title').textContent = 'Add Task';
            document.getElementById('task-title').value = '';
            document.getElementById('task-description').value = '';
            document.getElementById('task-assignee').value = '';
            document.getElementById('task-start-date').value = '';
            document.getElementById('task-due-date').value = '';
            document.getElementById('task-priority').value = 'medium';
        }

        modal.classList.add('modal-open');
        document.getElementById('task-title').focus();
    }

    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('modal-open');
        this.currentEditingTask = null;
        this.currentColumnId = null;
    }

    saveTask() {
        const data = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            assignee: document.getElementById('task-assignee').value,
            startDate: document.getElementById('task-start-date').value,
            dueDate: document.getElementById('task-due-date').value,
            priority: document.getElementById('task-priority').value,
            columnId: this.currentEditingTask?.columnId || this.currentColumnId || this.board.columns[0]?.id || 'backlog'
        };

        if (this.currentEditingTask) {
            this.board.updateTask(this.currentEditingTask.id, data);
        } else {
            this.board.addTask(data);
        }

        this.closeTaskModal();
    }

    openColumnModal() {
        const modal = document.getElementById('column-modal');
        document.getElementById('column-name').value = '';
        document.getElementById('column-color').value = '#6366f1';
        modal.classList.add('modal-open');
        document.getElementById('column-name').focus();
    }

    closeColumnModal() {
        document.getElementById('column-modal').classList.remove('modal-open');
    }

    saveColumn() {
        const data = {
            name: document.getElementById('column-name').value,
            color: document.getElementById('column-color').value
        };

        this.board.addColumn(data);
        this.closeColumnModal();
    }
}