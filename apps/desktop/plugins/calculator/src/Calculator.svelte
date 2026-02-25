<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // Calculator state
  let display = $state('0');
  let previousValue = $state<number | null>(null);
  let operator = $state<string | null>(null);
  let waitingForOperand = $state(false);
  let memory = $state(0);
  let hasMemory = $state(false);
  let lastOperation = $state('');

  // History state
  interface HistoryEntry {
    expression: string;
    result: string;
    timestamp: Date;
  }
  let history = $state<HistoryEntry[]>([]);
  let showHistory = $state(false);

  // Scientific mode state
  let scientificMode = $state(false);
  let angleMode = $state<'deg' | 'rad'>('deg');

  // Animation state
  let displayKey = $state(0);
  let pressedButton = $state<string | null>(null);
  let ripplePosition = $state<{ x: number; y: number } | null>(null);
  let copiedFeedback = $state(false);

  // Derived display for history/previous operation
  const historyDisplay = $derived(() => {
    if (previousValue !== null && operator) {
      return `${formatNumber(previousValue)} ${getOperatorSymbol(operator)}`;
    }
    return lastOperation;
  });

  // Format number for display
  function formatNumber(num: number): string {
    if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
      return num.toExponential(6);
    }
    const str = String(num);
    if (str.includes('.') && str.split('.')[1]?.length > 10) {
      return num.toFixed(10).replace(/\.?0+$/, '');
    }
    return str;
  }

  // Get display symbol for operator
  function getOperatorSymbol(op: string): string {
    const symbols: Record<string, string> = {
      '*': '\u00d7',
      '/': '\u00f7',
      '+': '+',
      '-': '\u2212'
    };
    return symbols[op] || op;
  }

  // Input a digit
  function inputDigit(digit: string) {
    if (waitingForOperand) {
      display = digit;
      waitingForOperand = false;
    } else {
      display = display === '0' ? digit : display + digit;
    }
    triggerDisplayAnimation();
  }

  // Input decimal point
  function inputDecimal() {
    if (waitingForOperand) {
      display = '0.';
      waitingForOperand = false;
      triggerDisplayAnimation();
      return;
    }
    if (!display.includes('.')) {
      display = display + '.';
      triggerDisplayAnimation();
    }
  }

  // Clear all
  function clearAll() {
    display = '0';
    previousValue = null;
    operator = null;
    waitingForOperand = false;
    lastOperation = '';
    triggerDisplayAnimation();
  }

  // Clear entry (current number only)
  function clearEntry() {
    display = '0';
    waitingForOperand = false;
    triggerDisplayAnimation();
  }

  // Backspace
  function backspace() {
    if (waitingForOperand) return;
    display = display.length > 1 ? display.slice(0, -1) : '0';
    triggerDisplayAnimation();
  }

  // Toggle sign
  function toggleSign() {
    const value = parseFloat(display);
    display = formatNumber(-value);
    triggerDisplayAnimation();
  }

  // Percentage
  function percentage() {
    const value = parseFloat(display);
    let result: number;
    if (previousValue !== null) {
      result = (previousValue * value) / 100;
    } else {
      result = value / 100;
    }
    display = formatNumber(result);
    triggerDisplayAnimation();
  }

  // Square root
  function squareRoot() {
    const value = parseFloat(display);
    if (value < 0) {
      display = 'Error';
      waitingForOperand = true;
      triggerDisplayAnimation();
      return;
    }
    const result = Math.sqrt(value);
    addToHistory(`\u221a(${formatNumber(value)})`, formatNumber(result));
    display = formatNumber(result);
    waitingForOperand = true;
    triggerDisplayAnimation();
  }

  // Scientific functions
  function scientificOp(op: string) {
    const value = parseFloat(display);
    let result: number;
    const angleValue = angleMode === 'deg' ? (value * Math.PI) / 180 : value;

    switch (op) {
      case 'sin':
        result = Math.sin(angleValue);
        addToHistory(`sin(${formatNumber(value)}${angleMode === 'deg' ? '\u00b0' : ''})`, formatNumber(result));
        break;
      case 'cos':
        result = Math.cos(angleValue);
        addToHistory(`cos(${formatNumber(value)}${angleMode === 'deg' ? '\u00b0' : ''})`, formatNumber(result));
        break;
      case 'tan':
        result = Math.tan(angleValue);
        addToHistory(`tan(${formatNumber(value)}${angleMode === 'deg' ? '\u00b0' : ''})`, formatNumber(result));
        break;
      case 'ln':
        if (value <= 0) {
          display = 'Error';
          waitingForOperand = true;
          triggerDisplayAnimation();
          return;
        }
        result = Math.log(value);
        addToHistory(`ln(${formatNumber(value)})`, formatNumber(result));
        break;
      case 'log':
        if (value <= 0) {
          display = 'Error';
          waitingForOperand = true;
          triggerDisplayAnimation();
          return;
        }
        result = Math.log10(value);
        addToHistory(`log(${formatNumber(value)})`, formatNumber(result));
        break;
      case 'x^2':
        result = value * value;
        addToHistory(`(${formatNumber(value)})\u00b2`, formatNumber(result));
        break;
      case 'x^y':
        handleOperator('^');
        return;
      case '1/x':
        if (value === 0) {
          display = 'Error';
          waitingForOperand = true;
          triggerDisplayAnimation();
          return;
        }
        result = 1 / value;
        addToHistory(`1/(${formatNumber(value)})`, formatNumber(result));
        break;
      case 'pi':
        result = Math.PI;
        break;
      case 'e':
        result = Math.E;
        break;
      case 'abs':
        result = Math.abs(value);
        addToHistory(`|${formatNumber(value)}|`, formatNumber(result));
        break;
      case 'exp':
        result = Math.exp(value);
        addToHistory(`e^${formatNumber(value)}`, formatNumber(result));
        break;
      default:
        return;
    }

    display = formatNumber(result);
    waitingForOperand = true;
    triggerDisplayAnimation();
  }

  // Memory functions
  function memoryClear() {
    memory = 0;
    hasMemory = false;
  }

  function memoryRecall() {
    display = formatNumber(memory);
    waitingForOperand = true;
    triggerDisplayAnimation();
  }

  function memoryAdd() {
    memory += parseFloat(display);
    hasMemory = true;
    waitingForOperand = true;
  }

  function memorySubtract() {
    memory -= parseFloat(display);
    hasMemory = true;
    waitingForOperand = true;
  }

  // Add to history
  function addToHistory(expression: string, result: string) {
    history = [
      { expression, result, timestamp: new Date() },
      ...history.slice(0, 49) // Keep last 50 entries
    ];
  }

  // Clear history
  function clearHistory() {
    history = [];
  }

  // Use history entry
  function useHistoryEntry(entry: HistoryEntry) {
    display = entry.result;
    waitingForOperand = true;
    triggerDisplayAnimation();
  }

  // Perform calculation
  function calculate(nextOperator: string | null = null) {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      previousValue = inputValue;
    } else if (operator) {
      const currentValue = previousValue;
      let result: number;

      switch (operator) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '*':
          result = currentValue * inputValue;
          break;
        case '/':
          if (inputValue === 0) {
            display = 'Error';
            previousValue = null;
            operator = null;
            waitingForOperand = true;
            triggerDisplayAnimation();
            return;
          }
          result = currentValue / inputValue;
          break;
        case '^':
          result = Math.pow(currentValue, inputValue);
          break;
        default:
          result = inputValue;
      }

      const expression = `${formatNumber(currentValue)} ${getOperatorSymbol(operator)} ${formatNumber(inputValue)}`;
      lastOperation = `${expression} =`;

      if (nextOperator === null) {
        addToHistory(expression, formatNumber(result));
      }

      display = formatNumber(result);
      previousValue = result;
      triggerDisplayAnimation();
    }

    waitingForOperand = true;
    operator = nextOperator;

    if (nextOperator === null) {
      previousValue = null;
    }
  }

  // Handle operator
  function handleOperator(nextOperator: string) {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      previousValue = inputValue;
    } else if (operator && !waitingForOperand) {
      calculate(nextOperator);
      return;
    }

    operator = nextOperator;
    waitingForOperand = true;
  }

  // Copy result to clipboard
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(display);
      copiedFeedback = true;
      setTimeout(() => {
        copiedFeedback = false;
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  // Display animation trigger
  function triggerDisplayAnimation() {
    displayKey++;
  }

  // Button press animation
  function handleButtonPress(id: string, event: MouseEvent) {
    pressedButton = id;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    ripplePosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    setTimeout(() => {
      pressedButton = null;
      ripplePosition = null;
    }, 300);
  }

  // Keyboard support
  function handleKeydown(event: KeyboardEvent) {
    const { key } = event;

    if (key >= '0' && key <= '9') {
      event.preventDefault();
      inputDigit(key);
    } else if (key === '.') {
      event.preventDefault();
      inputDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      event.preventDefault();
      handleOperator(key);
    } else if (key === 'Enter' || key === '=') {
      event.preventDefault();
      calculate();
    } else if (key === 'Escape') {
      event.preventDefault();
      clearAll();
    } else if (key === 'Backspace') {
      event.preventDefault();
      backspace();
    } else if (key === '%') {
      event.preventDefault();
      percentage();
    } else if (key === 'h' || key === 'H') {
      event.preventDefault();
      showHistory = !showHistory;
    } else if (key === 's' || key === 'S') {
      event.preventDefault();
      scientificMode = !scientificMode;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="calculator" class:scientific-mode={scientificMode}>
  <!-- Glass overlay -->
  <div class="glass-overlay"></div>

  <!-- History Panel -->
  <div class="history-panel" class:open={showHistory}>
    <div class="history-header">
      <h3>History</h3>
      <button class="history-clear" onclick={clearHistory} title="Clear history">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>
    <div class="history-list">
      {#if history.length === 0}
        <div class="history-empty">No calculations yet</div>
      {:else}
        {#each history as entry, i}
          <button class="history-entry" onclick={() => useHistoryEntry(entry)}>
            <span class="history-expression">{entry.expression}</span>
            <span class="history-result">= {entry.result}</span>
          </button>
        {/each}
      {/if}
    </div>
  </div>

  <!-- Main calculator content -->
  <div class="calculator-main">
    <!-- Top bar with mode toggles -->
    <div class="top-bar">
      <button
        class="mode-toggle"
        class:active={scientificMode}
        onclick={() => scientificMode = !scientificMode}
        title="Toggle scientific mode (S)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          <path d="M8 7h8M8 12h8M8 17h4"/>
        </svg>
        <span>SCI</span>
      </button>

      {#if scientificMode}
        <button
          class="angle-toggle"
          onclick={() => angleMode = angleMode === 'deg' ? 'rad' : 'deg'}
        >
          {angleMode.toUpperCase()}
        </button>
      {/if}

      <div class="spacer"></div>

      {#if hasMemory}
        <div class="memory-indicator">M</div>
      {/if}

      <button
        class="history-toggle"
        class:active={showHistory}
        onclick={() => showHistory = !showHistory}
        title="Toggle history (H)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
      </button>
    </div>

    <!-- Display area -->
    <div class="display-area">
      <div class="history-line">{historyDisplay()}</div>
      <div class="display-container">
        {#key displayKey}
          <div class="display" class:error={display === 'Error'}>
            {display}
          </div>
        {/key}
        <button
          class="copy-btn"
          onclick={copyToClipboard}
          class:copied={copiedFeedback}
          title="Copy to clipboard"
        >
          {#if copiedFeedback}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          {/if}
        </button>
      </div>
    </div>

    <!-- Scientific buttons (when enabled) -->
    {#if scientificMode}
      <div class="scientific-grid">
        <button class="btn scientific" onclick={(e) => { handleButtonPress('sin', e); scientificOp('sin'); }}>sin</button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('cos', e); scientificOp('cos'); }}>cos</button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('tan', e); scientificOp('tan'); }}>tan</button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('ln', e); scientificOp('ln'); }}>ln</button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('log', e); scientificOp('log'); }}>log</button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('x^2', e); scientificOp('x^2'); }}>x<sup>2</sup></button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('x^y', e); scientificOp('x^y'); }}>x<sup>y</sup></button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('1/x', e); scientificOp('1/x'); }}>1/x</button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('pi', e); scientificOp('pi'); }}>\u03c0</button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('e', e); scientificOp('e'); }}>e</button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('abs', e); scientificOp('abs'); }}>|x|</button>
        <button class="btn scientific" onclick={(e) => { handleButtonPress('exp', e); scientificOp('exp'); }}>e<sup>x</sup></button>
      </div>
    {/if}

    <!-- Memory row -->
    <div class="memory-grid">
      <button class="btn memory" onclick={(e) => { handleButtonPress('MC', e); memoryClear(); }}>MC</button>
      <button class="btn memory" onclick={(e) => { handleButtonPress('MR', e); memoryRecall(); }}>MR</button>
      <button class="btn memory" onclick={(e) => { handleButtonPress('M+', e); memoryAdd(); }}>M+</button>
      <button class="btn memory" onclick={(e) => { handleButtonPress('M-', e); memorySubtract(); }}>M-</button>
    </div>

    <!-- Main button grid -->
    <div class="button-grid">
      <!-- Row 1: Clear, sqrt, %, / -->
      <button class="btn clear" onclick={(e) => { handleButtonPress('C', e); clearAll(); }}>C</button>
      <button class="btn clear" onclick={(e) => { handleButtonPress('CE', e); clearEntry(); }}>CE</button>
      <button class="btn function" onclick={(e) => { handleButtonPress('sqrt', e); squareRoot(); }}>\u221a</button>
      <button class="btn operator" onclick={(e) => { handleButtonPress('/', e); handleOperator('/'); }}>\u00f7</button>

      <!-- Row 2: 7, 8, 9, * -->
      <button class="btn number" onclick={(e) => { handleButtonPress('7', e); inputDigit('7'); }}>7</button>
      <button class="btn number" onclick={(e) => { handleButtonPress('8', e); inputDigit('8'); }}>8</button>
      <button class="btn number" onclick={(e) => { handleButtonPress('9', e); inputDigit('9'); }}>9</button>
      <button class="btn operator" onclick={(e) => { handleButtonPress('*', e); handleOperator('*'); }}>\u00d7</button>

      <!-- Row 3: 4, 5, 6, - -->
      <button class="btn number" onclick={(e) => { handleButtonPress('4', e); inputDigit('4'); }}>4</button>
      <button class="btn number" onclick={(e) => { handleButtonPress('5', e); inputDigit('5'); }}>5</button>
      <button class="btn number" onclick={(e) => { handleButtonPress('6', e); inputDigit('6'); }}>6</button>
      <button class="btn operator" onclick={(e) => { handleButtonPress('-', e); handleOperator('-'); }}>\u2212</button>

      <!-- Row 4: 1, 2, 3, + -->
      <button class="btn number" onclick={(e) => { handleButtonPress('1', e); inputDigit('1'); }}>1</button>
      <button class="btn number" onclick={(e) => { handleButtonPress('2', e); inputDigit('2'); }}>2</button>
      <button class="btn number" onclick={(e) => { handleButtonPress('3', e); inputDigit('3'); }}>3</button>
      <button class="btn operator" onclick={(e) => { handleButtonPress('+', e); handleOperator('+'); }}>+</button>

      <!-- Row 5: +/-, 0, ., = -->
      <button class="btn function" onclick={(e) => { handleButtonPress('+-', e); toggleSign(); }}>+/\u2212</button>
      <button class="btn number zero" onclick={(e) => { handleButtonPress('0', e); inputDigit('0'); }}>0</button>
      <button class="btn number" onclick={(e) => { handleButtonPress('.', e); inputDecimal(); }}>.</button>
      <button class="btn equals" onclick={(e) => { handleButtonPress('=', e); calculate(); }}>=</button>
    </div>

    <!-- Bottom row -->
    <div class="bottom-row">
      <button class="btn function wide" onclick={(e) => { handleButtonPress('back', e); backspace(); }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/>
          <line x1="18" y1="9" x2="12" y2="15"/>
          <line x1="12" y1="9" x2="18" y2="15"/>
        </svg>
      </button>
      <button class="btn function wide" onclick={(e) => { handleButtonPress('%', e); percentage(); }}>%</button>
    </div>

    <div class="label">rdtect OS Calculator</div>
  </div>
</div>

<style>
  .calculator {
    display: flex;
    height: 100%;
    background: #0f172a;
    position: relative;
    overflow: hidden;
  }

  .glass-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.03) 0%,
      rgba(99, 102, 241, 0.01) 50%,
      rgba(99, 102, 241, 0.05) 100%
    );
    pointer-events: none;
  }

  /* History Panel */
  .history-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: 280px;
    height: 100%;
    background: rgba(15, 23, 42, 0.98);
    backdrop-filter: blur(var(--glass-blur));
    border-left: 1px solid rgba(99, 102, 241, 0.2);
    transform: translateX(100%);
    transition: transform var(--transition-slow) var(--transition-easing);
    z-index: 100;
    display: flex;
    flex-direction: column;
  }

  .history-panel.open {
    transform: translateX(0);
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
  }

  .history-header h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #e2e8f0;
    letter-spacing: 0.05em;
  }

  .history-clear {
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .history-clear:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .history-empty {
    text-align: center;
    color: #64748b;
    font-size: var(--text-sm);
    padding: 2rem;
  }

  .history-entry {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: var(--glass-bg-subtle);
    border: 1px solid rgba(99, 102, 241, 0.1);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    text-align: right;
  }

  .history-entry:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
  }

  .history-expression {
    font-size: 0.8rem;
    color: #94a3b8;
    margin-bottom: 0.25rem;
  }

  .history-result {
    font-size: 1.1rem;
    font-weight: 500;
    color: #e2e8f0;
  }

  /* Main Calculator */
  .calculator-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    position: relative;
    z-index: 1;
    font-family: var(--desktop-font-sans);
    transition: margin-right var(--transition-slow) var(--transition-easing);
  }

  .calculator.scientific-mode .calculator-main {
    /* Adjust for scientific mode if needed */
  }

  /* Top Bar */
  .top-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .mode-toggle,
  .history-toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.6rem;
    min-height: 44px;
    min-width: 44px;
    background: var(--glass-bg-default);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-md);
    color: #64748b;
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .mode-toggle:hover,
  .history-toggle:hover {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
    border-color: rgba(99, 102, 241, 0.3);
  }

  .mode-toggle.active,
  .history-toggle.active {
    background: rgba(99, 102, 241, 0.25);
    color: #a5b4fc;
    border-color: rgba(99, 102, 241, 0.4);
  }

  .angle-toggle {
    padding: 0.35rem 0.5rem;
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 6px;
    color: #a5b4fc;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .angle-toggle:hover {
    background: rgba(99, 102, 241, 0.3);
  }

  .spacer {
    flex: 1;
  }

  .memory-indicator {
    font-size: 0.7rem;
    color: #6366f1;
    font-weight: bold;
    background: rgba(99, 102, 241, 0.2);
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
  }

  /* Display Area */
  .display-area {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: var(--radius-xl);
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
    text-align: right;
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.2),
      0 4px 20px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(var(--glass-blur));
  }

  .history-line {
    font-size: 0.85rem;
    color: #64748b;
    min-height: 1.2rem;
    margin-bottom: 0.25rem;
    font-weight: 400;
  }

  .display-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .display {
    flex: 1;
    font-size: 2.5rem;
    font-weight: 300;
    color: #f1f5f9;
    word-break: break-all;
    min-height: 3rem;
    line-height: 3rem;
    text-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
    animation: displayFade 0.15s ease-out;
  }

  @keyframes displayFade {
    from {
      opacity: 0.6;
      transform: translateY(-2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .display.error {
    color: #ef4444;
    text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
  }

  .copy-btn {
    padding: 0.5rem;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .copy-btn:hover {
    background: rgba(99, 102, 241, 0.25);
    color: #a5b4fc;
  }

  .copy-btn.copied {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  /* Scientific Grid */
  .scientific-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.35rem;
    margin-bottom: 0.5rem;
    animation: slideDown 0.25s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .btn.scientific {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%);
    border: 1px solid rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
  }

  .btn.scientific:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%);
    border-color: rgba(99, 102, 241, 0.35);
  }

  .btn.scientific sup {
    font-size: 0.6rem;
    vertical-align: super;
  }

  /* Memory Grid */
  .memory-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.35rem;
    margin-bottom: 0.5rem;
  }

  /* Button Grid */
  .button-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    flex: 1;
  }

  /* Bottom Row */
  .bottom-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .btn.wide {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  /* Button Base Styles */
  .btn {
    border: none;
    border-radius: var(--radius-lg);
    font-size: 1.25rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-easing);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    min-height: 48px;
  }

  .btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .btn:hover::before {
    opacity: 1;
  }

  .btn:active {
    transform: scale(0.95);
  }

  /* Number Buttons */
  .btn.number {
    background: linear-gradient(145deg, #334155 0%, #1e293b 100%);
    color: #f1f5f9;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .btn.number:hover {
    background: linear-gradient(145deg, #475569 0%, #334155 100%);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  /* Operator Buttons */
  .btn.operator {
    background: linear-gradient(145deg, #6366f1 0%, #4f46e5 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 2px 8px rgba(99, 102, 241, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .btn.operator:hover {
    background: linear-gradient(145deg, #818cf8 0%, #6366f1 100%);
    box-shadow:
      0 4px 16px rgba(99, 102, 241, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  /* Equals Button */
  .btn.equals {
    background: linear-gradient(145deg, #22c55e 0%, #16a34a 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 2px 8px rgba(34, 197, 94, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .btn.equals:hover {
    background: linear-gradient(145deg, #4ade80 0%, #22c55e 100%);
    box-shadow:
      0 4px 16px rgba(34, 197, 94, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  /* Clear Buttons */
  .btn.clear {
    background: linear-gradient(145deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 2px 8px rgba(239, 68, 68, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .btn.clear:hover {
    background: linear-gradient(145deg, #f87171 0%, #ef4444 100%);
    box-shadow:
      0 4px 12px rgba(239, 68, 68, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  /* Function Buttons */
  .btn.function {
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
    color: #94a3b8;
    border: 1px solid rgba(99, 102, 241, 0.15);
    font-size: 1rem;
  }

  .btn.function:hover {
    background: linear-gradient(145deg, rgba(51, 65, 85, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    color: #e2e8f0;
    border-color: rgba(99, 102, 241, 0.25);
  }

  /* Memory Buttons */
  .btn.memory {
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
    color: #6366f1;
    border: 1px solid rgba(99, 102, 241, 0.15);
    font-size: 0.85rem;
    font-weight: 600;
    min-height: 40px;
  }

  .btn.memory:hover {
    background: rgba(99, 102, 241, 0.15);
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
  }

  /* Label */
  .label {
    margin-top: 0.75rem;
    font-size: 0.65rem;
    color: rgba(99, 102, 241, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    text-align: center;
    font-weight: 500;
  }

  /* Scrollbar styling for history */
  .history-list::-webkit-scrollbar {
    width: var(--scrollbar-width);
  }

  .history-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .history-list::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--radius-full);
  }

  .history-list::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }
</style>
