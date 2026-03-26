// Kanban board constants

export const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

export const PRIORITY_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
};

export const DEFAULT_COLUMNS = [
    { id: 'backlog', name: 'Backlog', color: '#64748b', order: 0 },
    { id: 'todo', name: 'To Do', color: '#6366f1', order: 1 },
    { id: 'in-progress', name: 'In Progress', color: '#f59e0b', order: 2 },
    { id: 'done', name: 'Done', color: '#10b981', order: 3 }
];

export const STORAGE_CONFIG = {
    DB_NAME: 'KanbanBoardDB',
    DB_VERSION: 1,
    TASKS_STORE: 'tasks',
    COLUMNS_STORE: 'columns'
};

export const ANIMATION_DURATION = {
    DRAG_START: 100,
    DROP: 200,
    CARD_ADD: 300,
    CARD_REMOVE: 250
};

export const DRAG_STATES = {
    IDLE: 'idle',
    DRAGGING: 'dragging',
    OVER: 'over'
};