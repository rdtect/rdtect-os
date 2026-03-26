/**
 * @fileoverview Pure game rule validation functions
 * All functions are static - no state, just rules
 */

/**
 * Game logic - Pure functions for move validation
 * @class GameLogic
 */
export class GameLogic {
    /**
     * Validates if a card can be placed on a foundation pile
     * Rules: Empty = must be Ace, Non-empty = same suit, sequential
     * 
     * @param {import('./Deck.js').Card[]} foundation - The foundation pile
     * @param {import('./Deck.js').Card} card - Card to place
     * @returns {boolean} True if move is valid
     */
    static isValidFoundationMove(foundation, card) {
        if (foundation.length === 0) {
            return card.value === 'A';
        }
        
        const topCard = foundation.at(-1);
        return topCard.suit === card.suit && 
               topCard.numericValue + 1 === card.numericValue;
    }
    
    /**
     * Validates if a card can be placed on a tableau pile
     * Rules: Empty = must be King, Non-empty = opposite color, descending
     * 
     * @param {import('./Deck.js').Card[]} pile - The tableau pile
     * @param {import('./Deck.js').Card} card - Card to place
     * @returns {boolean} True if move is valid
     */
    static isValidTableauMove(pile, card) {
        if (pile.length === 0) {
            return card.value === 'K';
        }
        
        const topCard = pile.at(-1);
        return topCard.color !== card.color && 
               topCard.numericValue - 1 === card.numericValue;
    }
    
    /**
     * Checks if the game is won (all foundations have 13 cards)
     * 
     * @param {import('./Deck.js').Card[][]} foundations - All 4 foundation piles
     * @returns {boolean} True if game is won
     */
    static checkWin(foundations) {
        return foundations.every(f => f.length === 13);
    }
}
