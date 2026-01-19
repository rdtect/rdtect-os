<script lang="ts">
  import { onMount, tick } from 'svelte';

  // Props
  interface Props {
    code: string;
    language?: 'python' | 'javascript';
    readonly?: boolean;
    onCodeChange?: (code: string) => void;
  }

  let {
    code = $bindable(''),
    language = 'python',
    readonly = false,
    onCodeChange
  }: Props = $props();

  // State
  let textarea: HTMLTextAreaElement;
  let highlightedCode = $state('');
  let lineNumbers = $state<number[]>([1]);

  // Python syntax highlighting keywords
  const pythonKeywords = [
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
    'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
    'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
    'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
    'True', 'False', 'None'
  ];

  // JavaScript syntax highlighting keywords
  const jsKeywords = [
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends',
    'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let',
    'new', 'of', 'return', 'static', 'switch', 'this', 'throw', 'try',
    'typeof', 'var', 'void', 'while', 'with', 'yield', 'true', 'false', 'null',
    'undefined', 'NaN', 'Infinity'
  ];

  // Built-in functions
  const pythonBuiltins = [
    'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set',
    'tuple', 'bool', 'type', 'input', 'open', 'map', 'filter', 'zip',
    'enumerate', 'sorted', 'reversed', 'sum', 'min', 'max', 'abs', 'round',
    'any', 'all', 'isinstance', 'hasattr', 'getattr', 'setattr', 'super'
  ];

  const jsBuiltins = [
    'console', 'Math', 'JSON', 'Array', 'Object', 'String', 'Number',
    'Boolean', 'Date', 'RegExp', 'Error', 'Promise', 'Map', 'Set',
    'setTimeout', 'setInterval', 'fetch', 'document', 'window'
  ];

  /**
   * Escape HTML special characters
   */
  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Apply syntax highlighting to code
   */
  function highlightSyntax(code: string, lang: 'python' | 'javascript'): string {
    const keywords = lang === 'python' ? pythonKeywords : jsKeywords;
    const builtins = lang === 'python' ? pythonBuiltins : jsBuiltins;

    let result = escapeHtml(code);

    // Highlight strings (single and double quotes)
    result = result.replace(
      /(["'`])(?:(?!\1)[^\\]|\\[\s\S])*?\1/g,
      '<span class="string">$&</span>'
    );

    // Highlight comments
    if (lang === 'python') {
      // Python single-line comments
      result = result.replace(
        /(#.*)$/gm,
        '<span class="comment">$1</span>'
      );
    } else {
      // JavaScript single-line and multi-line comments
      result = result.replace(
        /(\/\/.*$)/gm,
        '<span class="comment">$1</span>'
      );
      result = result.replace(
        /(\/\*[\s\S]*?\*\/)/g,
        '<span class="comment">$1</span>'
      );
    }

    // Highlight numbers
    result = result.replace(
      /\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/gi,
      '<span class="number">$1</span>'
    );

    // Highlight keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
      result = result.replace(regex, '<span class="keyword">$1</span>');
    });

    // Highlight built-ins
    builtins.forEach(builtin => {
      const regex = new RegExp(`\\b(${builtin})\\b`, 'g');
      result = result.replace(regex, '<span class="builtin">$1</span>');
    });

    // Highlight function definitions
    if (lang === 'python') {
      result = result.replace(
        /\b(def|class)\s+(\w+)/g,
        '<span class="keyword">$1</span> <span class="function">$2</span>'
      );
    } else {
      result = result.replace(
        /\b(function)\s+(\w+)/g,
        '<span class="keyword">$1</span> <span class="function">$2</span>'
      );
    }

    // Highlight decorators (Python)
    if (lang === 'python') {
      result = result.replace(
        /(@\w+)/g,
        '<span class="decorator">$1</span>'
      );
    }

    return result;
  }

  /**
   * Update line numbers based on code content
   */
  function updateLineNumbers(code: string): void {
    const lines = code.split('\n');
    lineNumbers = Array.from({ length: lines.length }, (_, i) => i + 1);
  }

  /**
   * Handle code input
   */
  function handleInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    code = target.value;
    updateLineNumbers(code);
    highlightedCode = highlightSyntax(code, language);
    onCodeChange?.(code);
  }

  /**
   * Handle tab key for indentation
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Insert tab (4 spaces)
      const spaces = '    ';
      code = code.substring(0, start) + spaces + code.substring(end);

      // Move cursor
      tick().then(() => {
        target.selectionStart = target.selectionEnd = start + spaces.length;
      });

      updateLineNumbers(code);
      highlightedCode = highlightSyntax(code, language);
      onCodeChange?.(code);
    }
  }

  /**
   * Sync scroll between textarea and highlighted display
   */
  function handleScroll(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const highlightDiv = document.querySelector('.highlight-overlay') as HTMLElement;
    const lineNumbersDiv = document.querySelector('.line-numbers') as HTMLElement;

    if (highlightDiv) {
      highlightDiv.scrollTop = target.scrollTop;
      highlightDiv.scrollLeft = target.scrollLeft;
    }
    if (lineNumbersDiv) {
      lineNumbersDiv.scrollTop = target.scrollTop;
    }
  }

  // Initialize on mount and when code changes
  $effect(() => {
    updateLineNumbers(code);
    highlightedCode = highlightSyntax(code, language);
  });

  onMount(() => {
    textarea?.focus();
  });
</script>

<div class="editor-container">
  <div class="line-numbers">
    {#each lineNumbers as num}
      <div class="line-number">{num}</div>
    {/each}
  </div>

  <div class="code-area">
    <pre class="highlight-overlay" aria-hidden="true">{@html highlightedCode}</pre>
    <textarea
      bind:this={textarea}
      value={code}
      oninput={handleInput}
      onkeydown={handleKeyDown}
      onscroll={handleScroll}
      class="code-input"
      spellcheck="false"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      {readonly}
      placeholder={language === 'python' ? '# Write your Python code here...' : '// Write your JavaScript code here...'}
    ></textarea>
  </div>
</div>

<style>
  .editor-container {
    display: flex;
    height: 100%;
    background-color: #1e1e1e;
    border-radius: 4px;
    overflow: hidden;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.5;
  }

  .line-numbers {
    flex-shrink: 0;
    padding: 12px 8px;
    background-color: #252526;
    color: #858585;
    text-align: right;
    user-select: none;
    overflow: hidden;
    border-right: 1px solid #3c3c3c;
    min-width: 40px;
  }

  .line-number {
    height: 21px;
    padding-right: 8px;
  }

  .code-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .highlight-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0;
    padding: 12px;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
    color: #d4d4d4;
    pointer-events: none;
  }

  .code-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 12px;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    color: transparent;
    caret-color: #aeafad;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
  }

  .code-input::placeholder {
    color: #6a6a6a;
  }

  .code-input:focus {
    outline: none;
  }

  /* Scrollbar styling */
  .highlight-overlay::-webkit-scrollbar,
  .code-input::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .highlight-overlay::-webkit-scrollbar-track,
  .code-input::-webkit-scrollbar-track {
    background: #1e1e1e;
  }

  .highlight-overlay::-webkit-scrollbar-thumb,
  .code-input::-webkit-scrollbar-thumb {
    background: #424242;
    border-radius: 5px;
  }

  .highlight-overlay::-webkit-scrollbar-thumb:hover,
  .code-input::-webkit-scrollbar-thumb:hover {
    background: #4f4f4f;
  }

  /* Syntax highlighting colors (VS Code Dark+ theme) */
  :global(.keyword) {
    color: #569cd6;
  }

  :global(.builtin) {
    color: #dcdcaa;
  }

  :global(.function) {
    color: #dcdcaa;
  }

  :global(.string) {
    color: #ce9178;
  }

  :global(.number) {
    color: #b5cea8;
  }

  :global(.comment) {
    color: #6a9955;
    font-style: italic;
  }

  :global(.decorator) {
    color: #dcdcaa;
  }
</style>
