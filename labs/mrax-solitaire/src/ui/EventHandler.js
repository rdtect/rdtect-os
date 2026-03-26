/**
 * @fileoverview Event handling and user input
 * Captures user interactions and delegates to game state
 */

import { GameLogic } from '../core/GameLogic.js';

/**
 * EventHandler class - Manages all event listeners and user interactions
 */
export class EventHandler {
    /**
     * @param {import('../state/GameState.js').GameState} game - Reference to main game
     */
    constructor(game) {
        this.game = game;
    }
    
    /**
     * Sets up all event listeners for the game
     */
    setupEventListeners() {
        // Stock pile click handler
        document.getElementById('stock').addEventListener('click', () => this.onStockClick());
        
        // Foundation drop zones (4 piles)
        this.game.foundations.forEach((_, i) => {
            const foundationEl = document.getElementById(`foundation-${i}`);
            this.setupDropZone(foundationEl, 'foundation', i);
        });
        
        // Tableau drop zones (7 piles)
        this.game.tableau.forEach((_, i) => {
            const tableauEl = document.getElementById(`tableau-${i}`);
            this.setupDropZone(tableauEl, 'tableau', i);
        });
        
        // Button handlers
        document.getElementById('new-game').addEventListener('click', () => this.onNewGame());
        document.getElementById('play-again').addEventListener('click', () => this.onPlayAgain());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.onKeyPress(e));
        
        // Global dragend cleanup (for cancelled drags)
        document.addEventListener('dragend', () => {
            document.querySelectorAll('.card.drag-preview').forEach(el => {
                el.classList.remove('drag-preview');
            });
        });
    }
    
    /**
     * Handles stock pile clicks (draw or recycle)
     */
    onStockClick() {
        if (this.game.isAnimating) return;
        
        if (this.game.stock.length > 0) {
            this.game.drawFromStock();
        } else if (this.game.waste.length > 0) {
            this.game.recycleWaste();
        }
    }
    
    /**
     * Handles drag start event
     * @param {DragEvent} e - The drag event
     * @param {import('../core/Deck.js').Card} card - Card being dragged
     * @param {string} from - Source location
     * @param {number} [pileIndex] - Source pile index
     * @param {number} [cardIndex] - Source card index
     */
    onDragStart(e, card, from, pileIndex = null, cardIndex = null) {
        if (this.game.isAnimating) {
            e.preventDefault();
            return;
        }
        
        this.game.draggedCard = card;
        this.game.draggedFrom = { from, pileIndex, cardIndex };
        
        // If dragging from tableau, show entire stack as dragging
        if (from === 'tableau' && cardIndex !== null) {
            const tableauEl = document.getElementById(`tableau-${pileIndex}`);
            const cardElements = tableauEl.querySelectorAll('.card');
            Array.from(cardElements).slice(cardIndex).forEach(el => {
                el.classList.add('drag-preview');
            });
        }
        
        e.target.classList.add('dragging');
    }
    
    /**
     * Handles double-click auto-move to foundation
     * @param {import('../core/Deck.js').Card} card - Card to auto-move
     * @param {string} from - Source location
     * @param {number} [pileIndex] - Source pile index
     */
    onCardDoubleClick(card, from, pileIndex = null) {
        const foundationIndex = this.game.autoMoveToFoundation(card);
        if (foundationIndex !== -1) {
            this.game.draggedCard = card;
            this.game.draggedFrom = { 
                from, 
                pileIndex, 
                cardIndex: from === 'tableau' ? this.game.tableau[pileIndex].length - 1 : null 
            };
            this.game.moveToFoundation(foundationIndex);
        }
    }
    
    /**
     * Handles new game button click
     */
    onNewGame() {
        this.game.resetGame();
    }
    
    /**
     * Handles play again button in win modal
     */
    onPlayAgain() {
        document.getElementById('win-modal').classList.add('hidden');
        this.game.resetGame();
    }
    
    /**
     * Sets up a drop zone for drag and drop
     * @param {HTMLElement} element - The drop zone element
     * @param {string} type - Type: 'foundation' or 'tableau'
     * @param {number} index - Pile index
     */
    setupDropZone(element, type, index) {
        // Cache type and index to avoid parsing during drag
        element.dataset.pileType = type;
        element.dataset.pileIndex = index;
        
        element.addEventListener('dragover', (e) => this.onDragOver(e, element));
        element.addEventListener('dragleave', () => this.onDragLeave(element));
        element.addEventListener('drop', (e) => this.onDrop(e, element, type, index));
    }
    
    /**
     * Handles drag over drop zone
     * @param {DragEvent} e - The drag event
     * @param {HTMLElement} element - The drop zone
     */
    onDragOver(e, element) {
        e.preventDefault();
        
        // Cache type and index from element dataset or parse once
        const type = element.dataset.pileType || 
            (element.id.includes('foundation') ? 'foundation' : 'tableau');
        const index = element.dataset.pileIndex || 
            parseInt(element.id.split('-').at(-1));
        
        const isValid = this.isValidDrop(type, index);
        element.classList.toggle('drag-over', isValid);
        element.classList.toggle('drag-over-invalid', !isValid);
    }
    
    /**
     * Handles drag leave drop zone
     * @param {HTMLElement} element - The drop zone
     */
    onDragLeave(element) {
        element.classList.remove('drag-over', 'drag-over-invalid');
    }
    
    /**
     * Handles drop on drop zone
     * @param {DragEvent} e - The drag event
     * @param {HTMLElement} element - The drop zone
     * @param {string} type - Drop zone type
     * @param {number} index - Pile index
     */
    onDrop(e, element, type, index) {
        e.preventDefault();
        element.classList.remove('drag-over', 'drag-over-invalid');
        
        // Clean up drag preview classes
        document.querySelectorAll('.card.drag-preview').forEach(el => {
            el.classList.remove('drag-preview');
        });
        
        if (type === 'foundation') {
            this.game.moveToFoundation(index);
        } else if (type === 'tableau') {
            this.game.moveToTableau(index);
        }
    }
    
    /**
     * Handles keyboard shortcuts
     * @param {KeyboardEvent} e - The keyboard event
     */
    onKeyPress(e) {
        if (this.game.isAnimating) return;
        
        switch(e.key.toLowerCase()) {
            case 'z':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.game.undo();
                }
                break;
            case 'n':
                e.preventDefault();
                this.onNewGame();
                break;
            case 'd':
            case ' ':
                e.preventDefault();
                this.onStockClick();
                break;
        }
    }
    
    /**
     * Checks if a drop would be valid for visual feedback
     * @param {string} type - 'foundation' or 'tableau'
     * @param {number} index - Pile index
     * @returns {boolean} True if drop would be valid
     */
    isValidDrop(type, index) {
        if (!this.game.draggedCard) return false;
        
        if (type === 'foundation') {
            return GameLogic.isValidFoundationMove(
                this.game.foundations[index], 
                this.game.draggedCard
            );
        } else {
            return GameLogic.isValidTableauMove(
                this.game.tableau[index],
                this.game.draggedCard
            );
        }
    }
}
