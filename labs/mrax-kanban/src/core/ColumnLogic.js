// Pure column logic

export class ColumnLogic {
    /**
     * Create a new column
     * @param {Object} data - Column data
     * @returns {Object} - New column
     */
    static createColumn(data) {
        return {
            id: Date.now() + Math.random(),
            name: data.name.trim(),
            color: data.color || '#6366f1',
            order: data.order ?? 0,
            createdAt: Date.now()
        };
    }

    /**
     * Validate column data
     * @param {Object} data - Column data
     * @returns {Object} - { valid: boolean, error: string }
     */
    static validateColumn(data) {
        if (!data.name || data.name.trim().length === 0) {
            return { valid: false, error: 'Column name is required' };
        }
        if (data.name.trim().length > 50) {
            return { valid: false, error: 'Column name too long (max 50 characters)' };
        }
        return { valid: true };
    }

    /**
     * Sort columns by order
     * @param {Array<Object>} columns - Columns to sort
     * @returns {Array<Object>} - Sorted columns
     */
    static sortColumns(columns) {
        return [...columns].sort((a, b) => a.order - b.order);
    }

    /**
     * Reorder columns after drag
     * @param {Array<Object>} columns - All columns
     * @returns {Array<Object>} - Reordered columns
     */
    static reorderColumns(columns) {
        return columns.map((col, index) => ({
            ...col,
            order: index
        }));
    }
}