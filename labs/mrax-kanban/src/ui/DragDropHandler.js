// Drag and drop handler
import { sleep } from '../core/utils.js';
import { ANIMATION_DURATION } from '../core/constants.js';

export class DragDropHandler {
    constructor(boardState) {
        this.board = boardState;
        this.draggedElement = null;
    }

    setupDragListeners() {
        // Will be called after columns are rendered
        // Listeners added via event delegation
    }

    onDragStart(e, task) {
        this.board.draggedTask = task;
        this.board.draggedFromColumn = task.columnId;
        this.draggedElement = e.target;

        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    onDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;

        // Remove all drag-over classes
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    onDragOver(e, columnId) {
        if (!this.board.draggedTask) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const column = e.currentTarget;
        column.classList.add('drag-over');
    }

    onDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    async onDrop(e, columnId) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (!this.board.draggedTask) return;

        const task = this.board.draggedTask;
        const fromColumn = this.board.draggedFromColumn;

        // If same column, don't do anything
        if (fromColumn === columnId) {
            this.board.draggedTask = null;
            this.board.draggedFromColumn = null;
            return;
        }

        // Get new order (add to end of column)
        const columnTasks = this.board.getTasksByColumn(columnId);
        const newOrder = columnTasks.length;

        // Move task
        await this.board.moveTask(task.id, columnId, newOrder);

        // Reset drag state
        this.board.draggedTask = null;
        this.board.draggedFromColumn = null;
    }
}