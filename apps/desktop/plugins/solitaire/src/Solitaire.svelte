<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // === Types ===
  interface Card {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    value: string;
    numericValue: number;
    color: 'red' | 'black';
    faceUp: boolean;
  }

  type PileSource =
    | { type: 'waste' }
    | { type: 'tableau'; pileIndex: number; cardIndex: number }
    | { type: 'foundation'; pileIndex: number };

  const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const SUIT_SYMBOLS: Record<string, string> = {
    hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
  };
  const RED_SUITS = new Set(['hearts', 'diamonds']);

  // === Game State ===
  let stock = $state<Card[]>([]);
  let waste = $state<Card[]>([]);
  let foundations = $state<Card[][]>([[], [], [], []]);
  let tableau = $state<Card[][]>([[], [], [], [], [], [], []]);
  let moves = $state(0);
  let gameWon = $state(false);
  let dragCards = $state<Card[]>([]);
  let dragSource = $state<PileSource | null>(null);

  // === Deck Creation ===
  function createDeck(): Card[] {
    const cards: Card[] = [];
    for (const suit of SUITS) {
      for (let i = 0; i < VALUES.length; i++) {
        cards.push({
          suit,
          value: VALUES[i],
          numericValue: i + 1,
          color: RED_SUITS.has(suit) ? 'red' : 'black',
          faceUp: false,
        });
      }
    }
    return cards;
  }

  function shuffle(arr: Card[]): Card[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // === Game Logic ===
  function isValidFoundationMove(foundation: Card[], card: Card): boolean {
    if (foundation.length === 0) return card.value === 'A';
    const top = foundation[foundation.length - 1];
    return top.suit === card.suit && top.numericValue + 1 === card.numericValue;
  }

  function isValidTableauMove(pile: Card[], card: Card): boolean {
    if (pile.length === 0) return card.value === 'K';
    const top = pile[pile.length - 1];
    return top.color !== card.color && top.numericValue - 1 === card.numericValue;
  }

  function checkWin(): boolean {
    return foundations.every(f => f.length === 13);
  }

  // === Actions ===
  function newGame() {
    const deck = shuffle(createDeck());
    let idx = 0;

    const newTableau: Card[][] = [[], [], [], [], [], [], []];
    for (let col = 0; col < 7; col++) {
      for (let row = col; row < 7; row++) {
        const card = { ...deck[idx++] };
        card.faceUp = row === col;
        newTableau[row].push(card);
      }
    }

    tableau = newTableau;
    stock = deck.slice(idx).map(c => ({ ...c, faceUp: false }));
    waste = [];
    foundations = [[], [], [], []];
    moves = 0;
    gameWon = false;
    dragCards = [];
    dragSource = null;
  }

  function drawFromStock() {
    if (stock.length === 0) {
      // Recycle waste back to stock
      stock = [...waste].reverse().map(c => ({ ...c, faceUp: false }));
      waste = [];
    } else {
      const card = { ...stock[stock.length - 1], faceUp: true };
      stock = stock.slice(0, -1);
      waste = [...waste, card];
    }
    moves++;
  }

  function tryAutoFoundation(card: Card, source: PileSource): boolean {
    for (let i = 0; i < 4; i++) {
      if (isValidFoundationMove(foundations[i], card)) {
        // Remove from source
        removeFromSource(source);
        foundations[i] = [...foundations[i], card];
        flipTopCard(source);
        moves++;
        if (checkWin()) gameWon = true;
        return true;
      }
    }
    return false;
  }

  function removeFromSource(source: PileSource) {
    if (source.type === 'waste') {
      waste = waste.slice(0, -1);
    } else if (source.type === 'tableau') {
      tableau[source.pileIndex] = tableau[source.pileIndex].slice(0, source.cardIndex);
    } else if (source.type === 'foundation') {
      foundations[source.pileIndex] = foundations[source.pileIndex].slice(0, -1);
    }
  }

  function flipTopCard(source: PileSource) {
    if (source.type === 'tableau') {
      const pile = tableau[source.pileIndex];
      if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
        tableau[source.pileIndex] = [
          ...pile.slice(0, -1),
          { ...pile[pile.length - 1], faceUp: true },
        ];
      }
    }
  }

  // === Drag & Drop ===
  function onDragStart(cards: Card[], source: PileSource) {
    dragCards = cards;
    dragSource = source;
  }

  function onDropTableau(pileIndex: number) {
    if (dragCards.length === 0 || !dragSource) return;
    if (!isValidTableauMove(tableau[pileIndex], dragCards[0])) {
      dragCards = [];
      dragSource = null;
      return;
    }
    removeFromSource(dragSource);
    tableau[pileIndex] = [...tableau[pileIndex], ...dragCards];
    flipTopCard(dragSource);
    moves++;
    dragCards = [];
    dragSource = null;
  }

  function onDropFoundation(foundationIndex: number) {
    if (dragCards.length !== 1 || !dragSource) return;
    if (!isValidFoundationMove(foundations[foundationIndex], dragCards[0])) {
      dragCards = [];
      dragSource = null;
      return;
    }
    removeFromSource(dragSource);
    foundations[foundationIndex] = [...foundations[foundationIndex], dragCards[0]];
    flipTopCard(dragSource);
    moves++;
    if (checkWin()) gameWon = true;
    dragCards = [];
    dragSource = null;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleCardDoubleClick(card: Card, source: PileSource) {
    tryAutoFoundation(card, source);
  }

  function cardDisplay(card: Card): string {
    return `${card.value}${SUIT_SYMBOLS[card.suit]}`;
  }

  onMount(() => {
    newGame();
  });
</script>

<div class="solitaire">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h3>Solitaire</h3>
      <span class="move-count">Moves: {moves}</span>
    </div>
    <button class="new-game-btn" onclick={newGame}>New Game</button>
  </div>

  {#if gameWon}
    <div class="win-overlay">
      <div class="win-modal">
        <h2>You Win!</h2>
        <p>Completed in {moves} moves</p>
        <button class="new-game-btn" onclick={newGame}>Play Again</button>
      </div>
    </div>
  {/if}

  <!-- Top Row: Stock, Waste, Foundations -->
  <div class="top-row">
    <!-- Stock -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="pile stock-pile" onclick={drawFromStock}>
      {#if stock.length > 0}
        <div class="card back">
          <span class="back-pattern"></span>
        </div>
      {:else}
        <div class="card empty-slot recycle">↻</div>
      {/if}
    </div>

    <!-- Waste -->
    <div class="pile waste-pile">
      {#if waste.length > 0}
        {@const card = waste[waste.length - 1]}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="card face-up {card.color}"
          draggable="true"
          ondragstart={() => onDragStart([card], { type: 'waste' })}
          ondblclick={() => handleCardDoubleClick(card, { type: 'waste' })}
        >
          <span class="card-value top-left">{cardDisplay(card)}</span>
          <span class="card-suit-center">{SUIT_SYMBOLS[card.suit]}</span>
          <span class="card-value bottom-right">{cardDisplay(card)}</span>
        </div>
      {:else}
        <div class="card empty-slot"></div>
      {/if}
    </div>

    <div class="spacer"></div>

    <!-- Foundations -->
    {#each foundations as foundation, fi}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="pile foundation-pile"
        ondragover={handleDragOver}
        ondrop={() => onDropFoundation(fi)}
      >
        {#if foundation.length > 0}
          {@const card = foundation[foundation.length - 1]}
          <div class="card face-up {card.color}">
            <span class="card-value top-left">{cardDisplay(card)}</span>
            <span class="card-suit-center">{SUIT_SYMBOLS[card.suit]}</span>
            <span class="card-value bottom-right">{cardDisplay(card)}</span>
          </div>
        {:else}
          <div class="card empty-slot foundation-empty">{SUIT_SYMBOLS[SUITS[fi]]}</div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Tableau -->
  <div class="tableau">
    {#each tableau as pile, pi}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="tableau-col"
        ondragover={handleDragOver}
        ondrop={() => onDropTableau(pi)}
      >
        {#if pile.length === 0}
          <div class="card empty-slot tableau-empty">K</div>
        {/if}
        {#each pile as card, ci}
          {#if card.faceUp}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="card face-up {card.color} stacked"
              style="top: {ci * 22}px"
              draggable="true"
              ondragstart={() => onDragStart(pile.slice(ci), { type: 'tableau', pileIndex: pi, cardIndex: ci })}
              ondblclick={() => {
                if (ci === pile.length - 1) {
                  handleCardDoubleClick(card, { type: 'tableau', pileIndex: pi, cardIndex: ci });
                }
              }}
            >
              <span class="card-value top-left">{cardDisplay(card)}</span>
              <span class="card-suit-center">{SUIT_SYMBOLS[card.suit]}</span>
              <span class="card-value bottom-right">{cardDisplay(card)}</span>
            </div>
          {:else}
            <div class="card back stacked" style="top: {ci * 10}px">
              <span class="back-pattern"></span>
            </div>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .solitaire {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f4f2a;
    font-family: var(--desktop-font-sans);
    overflow: hidden;
    user-select: none;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }
  .header-left { display: flex; align-items: center; gap: 16px; }
  h3 { margin: 0; font-size: 14px; color: #e2e8f0; font-weight: 600; }
  .move-count { font-size: 12px; color: #94a3b8; }
  .new-game-btn {
    padding: 6px 16px; background: rgba(99, 102, 241, 0.8);
    border: none; border-radius: var(--radius-md); color: white;
    font-size: 12px; font-weight: 600; cursor: pointer;
    transition: background 0.2s;
  }
  .new-game-btn:hover { background: rgba(99, 102, 241, 1); }

  /* Top Row */
  .top-row {
    display: flex;
    gap: 8px;
    padding: 12px 16px 8px;
    flex-shrink: 0;
  }
  .spacer { flex: 1; }

  /* Piles */
  .pile { position: relative; width: 70px; height: 96px; flex-shrink: 0; }

  /* Cards */
  .card {
    width: 70px;
    height: 96px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    font-size: 11px;
    font-weight: 700;
    transition: box-shadow 0.15s;
  }

  .card.stacked {
    position: absolute;
    left: 0;
  }

  .face-up {
    background: #f8fafc;
    border: 1px solid rgba(0, 0, 0, 0.15);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    cursor: grab;
  }
  .face-up:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
  .face-up.red { color: #dc2626; }
  .face-up.black { color: #1e293b; }

  .back {
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    border: 2px solid #60a5fa;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }
  .back-pattern {
    width: 52px;
    height: 78px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      rgba(255, 255, 255, 0.08) 4px,
      rgba(255, 255, 255, 0.08) 8px
    );
  }

  .empty-slot {
    background: rgba(255, 255, 255, 0.08);
    border: 2px dashed rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.3);
    font-size: 20px;
  }
  .recycle { cursor: pointer; font-size: 24px; }
  .recycle:hover { background: rgba(255, 255, 255, 0.12); }
  .foundation-empty { font-size: 24px; opacity: 0.4; }
  .tableau-empty { font-size: 16px; opacity: 0.3; }

  /* Card text */
  .card-value {
    position: absolute;
    font-size: 10px;
    line-height: 1;
  }
  .top-left { top: 4px; left: 5px; }
  .bottom-right { bottom: 4px; right: 5px; transform: rotate(180deg); }
  .card-suit-center { font-size: 22px; }

  /* Tableau */
  .tableau {
    display: flex;
    gap: 8px;
    padding: 8px 16px;
    flex: 1;
    overflow: hidden;
  }

  .tableau-col {
    position: relative;
    width: 70px;
    min-height: 96px;
    flex-shrink: 0;
  }

  /* Win Overlay */
  .win-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }
  .win-modal {
    background: #1e293b;
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: var(--radius-xl);
    padding: 32px 48px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .win-modal h2 { color: #4ade80; font-size: 1.5rem; margin: 0 0 8px; }
  .win-modal p { color: #94a3b8; font-size: 0.9rem; margin: 0 0 16px; }
</style>
