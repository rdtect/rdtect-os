/**
 * @fileoverview DOM rendering and manipulation
 * Responsible for all visual updates to the game board
 */

import { SUIT_SYMBOLS, TABLEAU_CARD_OFFSET } from '../core/constants.js';

/**
 * Renderer class - Handles all DOM manipulation
 */
export class Renderer {
    /**
     * Creates a DOM element for a card
     * @param {import('../core/Deck.js').Card} card - The card data
     * @param {boolean} faceUp - Whether to show card face
     * @returns {HTMLElement} The card element
     */
    createCardElement(card, faceUp) {
        const cardEl = document.createElement('div');
        cardEl.className = faceUp ? `card ${card.color}` : 'card face-down';
        
        if (faceUp) {
            cardEl.innerHTML = `
                <div class="card-top">
                    <span class="card-value">${card.value}</span>
                    <span class="card-suit">${SUIT_SYMBOLS[card.suit]}</span>
                </div>
                <div class="card-center">
                    <span class="card-suit">${SUIT_SYMBOLS[card.suit]}</span>
                </div>
                <div class="card-bottom">
                    <span class="card-value">${card.value}</span>
                    <span class="card-suit">${SUIT_SYMBOLS[card.suit]}</span>
                </div>
            `;
        }
        
        return cardEl;
    }
    
    /**
     * Renders the stock pile
     * @param {import('../core/Deck.js').Card[]} stock - Stock pile cards
     */
    renderStock(stock) {
        const stockEl = document.getElementById('stock');
        stockEl.innerHTML = '';
        
        if (stock.length > 0) {
            const cardEl = this.createCardElement(stock.at(-1), false);
            stockEl.appendChild(cardEl);
        }
    }
    
    /**
     * Renders the waste pile with drag handlers
     * @param {import('../core/Deck.js').Card[]} waste - Waste pile cards
     * @param {Function} onDragStart - Drag start callback
     * @param {Function} onDoubleClick - Double click callback
     */
    renderWaste(waste, onDragStart, onDoubleClick) {
        const wasteEl = document.getElementById('waste');
        wasteEl.innerHTML = '';
        
        if (waste.length > 0) {
            const card = waste.at(-1);
            const cardEl = this.createCardElement(card, true);
            this.attachDragListeners(cardEl, card, onDragStart, 'waste');
            cardEl.addEventListener('dblclick', () => onDoubleClick(card, 'waste'));
            wasteEl.appendChild(cardEl);
        }
    }
    
    /**
     * Renders all foundation piles
     * @param {import('../core/Deck.js').Card[][]} foundations - All 4 foundation piles
     */
    renderFoundations(foundations) {
        foundations.forEach((foundation, index) => {
            const foundationEl = document.getElementById(`foundation-${index}`);
            foundationEl.innerHTML = '';
            
            if (foundation.length > 0) {
                const card = foundation.at(-1);
                const cardEl = this.createCardElement(card, true);
                foundationEl.appendChild(cardEl);
            }
        });
    }
    
    /**
     * Renders all tableau piles
     * @param {import('../core/Deck.js').Card[][]} tableau - All 7 tableau piles
     * @param {Function} onDragStart - Drag start callback
     * @param {Function} onDoubleClick - Double click callback
     */
    renderTableau(tableau, onDragStart, onDoubleClick) {
        tableau.forEach((pile, pileIndex) => {
            this.renderTableauPile(pile, pileIndex, onDragStart, onDoubleClick, false);
        });
    }
    
    /**
     * Renders a single tableau pile
     * @param {import('../core/Deck.js').Card[]} pile - The pile cards
     * @param {number} pileIndex - Pile index (0-6)
     * @param {Function} onDragStart - Drag start callback
     * @param {Function} onDoubleClick - Double click callback
     * @param {boolean} withAnimation - Whether to animate dealing
     */
    renderTableauPile(pile, pileIndex, onDragStart, onDoubleClick, withAnimation = false) {
        const tableauEl = document.getElementById(`tableau-${pileIndex}`);
        tableauEl.innerHTML = '';
        
        pile.forEach((card, cardIndex) => {
            const cardEl = this.createCardElement(card, card.faceUp);
            cardEl.style.top = `${cardIndex * TABLEAU_CARD_OFFSET}px`;
            
            if (withAnimation) {
                cardEl.classList.add('dealing');
            }
            
            if (card.faceUp) {
                this.attachDragListeners(cardEl, card, onDragStart, 'tableau', pileIndex, cardIndex);
                // Only top card gets double-click
                if (cardIndex === pile.length - 1) {
                    cardEl.addEventListener('dblclick', () => onDoubleClick(card, 'tableau', pileIndex));
                }
            }
            
            tableauEl.appendChild(cardEl);
        });
    }
    
    /**
     * Attaches drag event listeners to a card element
     * @param {HTMLElement} cardEl - The card DOM element
     * @param {import('../core/Deck.js').Card} card - The card data
     * @param {Function} onDragStart - Drag start callback
     * @param {string} from - Source location (waste, tableau)
     * @param {number} [pileIndex] - Pile index if from tableau
     * @param {number} [cardIndex] - Card index if from tableau
     */
    attachDragListeners(cardEl, card, onDragStart, from, pileIndex = null, cardIndex = null) {
        cardEl.draggable = true;
        cardEl.addEventListener('dragstart', (e) => 
            onDragStart(e, card, from, pileIndex, cardIndex)
        );
        cardEl.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            // Clean up all drag-related classes
            setTimeout(() => {
                document.querySelectorAll('.card.dragging, .card.drag-preview').forEach(c => {
                    c.classList.remove('dragging', 'drag-preview');
                });
            }, 0);
        });
    }
    
    /**
     * Updates the move counter display
     * @param {number} moves - Current move count
     */
    updateStats(moves) {
        document.getElementById('moves').textContent = moves;
    }
}
