<script lang="ts">
  import { onMount } from 'svelte';

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // View mode: 'split' | 'editor' | 'preview'
  let viewMode = $state<'split' | 'editor' | 'preview'>('split');

  // Editor content
  let content = $state(`# Welcome to Markdown Editor

This is a **full-featured** Markdown editor with *live preview*.

## Features

- **Bold**, *Italic*, and ~~Strikethrough~~ text
- Multiple heading levels
- Bullet and numbered lists
- Code blocks with syntax highlighting
- Links and images
- Blockquotes
- Tables

### Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet('World');
\`\`\`

### Inline Code

You can also use \`inline code\` in your text.

### Blockquote

> This is a blockquote.
> It can span multiple lines.

### Table

| Name | Age | City |
|------|-----|------|
| Alice | 25 | NYC |
| Bob | 30 | LA |

### Links and Images

[Visit GitHub](https://github.com)

![Placeholder](https://via.placeholder.com/150)

---

Enjoy writing!
`);

  // Textarea reference
  let textareaRef = $state<HTMLTextAreaElement | null>(null);

  // Word and character count
  const wordCount = $derived(() => {
    const text = content.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  });

  const charCount = $derived(() => content.length);
  const charCountNoSpaces = $derived(() => content.replace(/\s/g, '').length);

  // Simple Markdown parser
  function parseMarkdown(md: string): string {
    let html = md;

    // Escape HTML entities first to prevent XSS
    html = html.replace(/&/g, '&amp;');
    html = html.replace(/</g, '&lt;');
    html = html.replace(/>/g, '&gt;');

    // Code blocks (must be done early to protect content inside)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const highlightedCode = highlightCode(code.trim(), lang);
      return `<pre class="code-block" data-lang="${lang}"><code>${highlightedCode}</code></pre>`;
    });

    // Inline code (must be before other inline formatting)
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Tables
    html = parseTable(html);

    // Headers (must check for # at start of line)
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Horizontal rules
    html = html.replace(/^---+$/gm, '<hr />');
    html = html.replace(/^\*\*\*+$/gm, '<hr />');
    html = html.replace(/^___+$/gm, '<hr />');

    // Bold (must be before italic)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Images (must be before links)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-image" />');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Blockquotes
    html = parseBlockquotes(html);

    // Lists
    html = parseLists(html);

    // Paragraphs (wrap remaining text)
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  }

  function parseBlockquotes(html: string): string {
    const lines = html.split('\n');
    let result: string[] = [];
    let inBlockquote = false;
    let blockquoteContent: string[] = [];

    for (const line of lines) {
      const match = line.match(/^&gt;\s?(.*)$/);
      if (match) {
        if (!inBlockquote) {
          inBlockquote = true;
          blockquoteContent = [];
        }
        blockquoteContent.push(match[1]);
      } else {
        if (inBlockquote) {
          result.push(`<blockquote>${blockquoteContent.join('<br />')}</blockquote>`);
          inBlockquote = false;
          blockquoteContent = [];
        }
        result.push(line);
      }
    }

    if (inBlockquote) {
      result.push(`<blockquote>${blockquoteContent.join('<br />')}</blockquote>`);
    }

    return result.join('\n');
  }

  function parseLists(html: string): string {
    const lines = html.split('\n');
    let result: string[] = [];
    let inUl = false;
    let inOl = false;

    for (const line of lines) {
      const ulMatch = line.match(/^[-*+]\s+(.+)$/);
      const olMatch = line.match(/^\d+\.\s+(.+)$/);

      if (ulMatch) {
        if (!inUl) {
          if (inOl) {
            result.push('</ol>');
            inOl = false;
          }
          result.push('<ul>');
          inUl = true;
        }
        result.push(`<li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (!inOl) {
          if (inUl) {
            result.push('</ul>');
            inUl = false;
          }
          result.push('<ol>');
          inOl = true;
        }
        result.push(`<li>${olMatch[1]}</li>`);
      } else {
        if (inUl) {
          result.push('</ul>');
          inUl = false;
        }
        if (inOl) {
          result.push('</ol>');
          inOl = false;
        }
        result.push(line);
      }
    }

    if (inUl) result.push('</ul>');
    if (inOl) result.push('</ol>');

    return result.join('\n');
  }

  function parseTable(html: string): string {
    const lines = html.split('\n');
    let result: string[] = [];
    let inTable = false;
    let headerDone = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isTableRow = line.match(/^\|(.+)\|$/);
      const isSeparator = line.match(/^\|[\s\-:|]+\|$/);

      if (isTableRow && !isSeparator) {
        if (!inTable) {
          result.push('<table>');
          inTable = true;
          headerDone = false;
        }

        const cells = line.split('|').filter(c => c.trim() !== '');
        const tag = !headerDone ? 'th' : 'td';
        const row = cells.map(cell => `<${tag}>${cell.trim()}</${tag}>`).join('');

        if (!headerDone) {
          result.push(`<thead><tr>${row}</tr></thead><tbody>`);
        } else {
          result.push(`<tr>${row}</tr>`);
        }
      } else if (isSeparator && inTable) {
        headerDone = true;
      } else {
        if (inTable) {
          result.push('</tbody></table>');
          inTable = false;
        }
        result.push(line);
      }
    }

    if (inTable) {
      result.push('</tbody></table>');
    }

    return result.join('\n');
  }

  function highlightCode(code: string, lang: string): string {
    // Basic syntax highlighting for common languages
    let highlighted = code;

    // Keywords for JavaScript/TypeScript
    const jsKeywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'typeof', 'instanceof'];

    // Keywords for Python
    const pyKeywords = ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'yield', 'pass', 'break', 'continue', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is'];

    const keywords = lang === 'python' || lang === 'py' ? pyKeywords : jsKeywords;

    // Highlight strings (double and single quotes)
    highlighted = highlighted.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-string">$1</span>');
    highlighted = highlighted.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>');
    highlighted = highlighted.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="hl-string">$1</span>');

    // Highlight comments
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="hl-comment">$1</span>');
    highlighted = highlighted.replace(/(#.*$)/gm, '<span class="hl-comment">$1</span>');

    // Highlight numbers
    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');

    // Highlight keywords
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
      highlighted = highlighted.replace(regex, '<span class="hl-keyword">$1</span>');
    }

    // Highlight function calls
    highlighted = highlighted.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="hl-function">$1</span>(');

    return highlighted;
  }

  // Derived preview HTML
  const previewHtml = $derived(parseMarkdown(content));

  // Toolbar actions
  function insertFormatting(before: string, after: string = before) {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    content = newText;

    // Restore cursor position
    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus();
        const newCursorPos = selectedText ? start + before.length + selectedText.length + after.length : start + before.length;
        textareaRef.setSelectionRange(
          selectedText ? start : start + before.length,
          selectedText ? newCursorPos : start + before.length
        );
      }
    }, 0);
  }

  function insertAtLineStart(prefix: string) {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const newText = content.substring(0, lineStart) + prefix + content.substring(lineStart);

    content = newText;

    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus();
        textareaRef.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  }

  function insertCodeBlock() {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = content.substring(start, end);
    const codeBlock = '\n```\n' + (selectedText || 'code here') + '\n```\n';
    const newText = content.substring(0, start) + codeBlock + content.substring(end);

    content = newText;

    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus();
      }
    }, 0);
  }

  function insertLink() {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = content.substring(start, end) || 'link text';
    const link = `[${selectedText}](url)`;
    const newText = content.substring(0, start) + link + content.substring(end);

    content = newText;

    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus();
      }
    }, 0);
  }

  function insertImage() {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = content.substring(start, end) || 'alt text';
    const image = `![${selectedText}](url)`;
    const newText = content.substring(0, start) + image + content.substring(end);

    content = newText;

    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus();
      }
    }, 0);
  }

  function insertHorizontalRule() {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const newText = content.substring(0, start) + '\n\n---\n\n' + content.substring(start);

    content = newText;

    setTimeout(() => {
      if (textareaRef) {
        textareaRef.focus();
      }
    }, 0);
  }

  // Keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertFormatting('**');
          break;
        case 'i':
          e.preventDefault();
          insertFormatting('*');
          break;
        case 'k':
          e.preventDefault();
          insertLink();
          break;
        case '`':
          e.preventDefault();
          insertFormatting('`');
          break;
      }
    }
  }

  // Toolbar button data
  const toolbarButtons = [
    { label: 'B', title: 'Bold (Ctrl+B)', action: () => insertFormatting('**'), style: 'font-weight: bold;' },
    { label: 'I', title: 'Italic (Ctrl+I)', action: () => insertFormatting('*'), style: 'font-style: italic;' },
    { label: 'S', title: 'Strikethrough', action: () => insertFormatting('~~'), style: 'text-decoration: line-through;' },
    { type: 'separator' },
    { label: 'H1', title: 'Heading 1', action: () => insertAtLineStart('# ') },
    { label: 'H2', title: 'Heading 2', action: () => insertAtLineStart('## ') },
    { label: 'H3', title: 'Heading 3', action: () => insertAtLineStart('### ') },
    { type: 'separator' },
    { label: '-', title: 'Bullet List', action: () => insertAtLineStart('- '), style: 'font-size: 18px;' },
    { label: '1.', title: 'Numbered List', action: () => insertAtLineStart('1. ') },
    { type: 'separator' },
    { label: '<>', title: 'Code Block', action: insertCodeBlock },
    { label: '`', title: 'Inline Code (Ctrl+`)', action: () => insertFormatting('`') },
    { type: 'separator' },
    { label: '#', title: 'Link (Ctrl+K)', action: insertLink },
    { label: 'Img', title: 'Image', action: insertImage, style: 'font-size: 11px;' },
    { type: 'separator' },
    { label: '"', title: 'Blockquote', action: () => insertAtLineStart('> ') },
    { label: '--', title: 'Horizontal Rule', action: insertHorizontalRule },
  ];
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="markdown-editor" onkeydown={handleKeydown}>
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-group">
      {#each toolbarButtons as btn}
        {#if btn.type === 'separator'}
          <div class="toolbar-separator"></div>
        {:else}
          <button
            class="toolbar-btn"
            title={btn.title}
            onclick={btn.action}
            style={btn.style || ''}
          >
            {btn.label}
          </button>
        {/if}
      {/each}
    </div>

    <div class="toolbar-group view-toggle">
      <button
        class="toolbar-btn"
        class:active={viewMode === 'editor'}
        title="Editor Only"
        onclick={() => viewMode = 'editor'}
      >
        Edit
      </button>
      <button
        class="toolbar-btn"
        class:active={viewMode === 'split'}
        title="Split View"
        onclick={() => viewMode = 'split'}
      >
        Split
      </button>
      <button
        class="toolbar-btn"
        class:active={viewMode === 'preview'}
        title="Preview Only"
        onclick={() => viewMode = 'preview'}
      >
        Preview
      </button>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="content-area" class:split-view={viewMode === 'split'}>
    <!-- Editor Pane -->
    {#if viewMode === 'editor' || viewMode === 'split'}
      <div class="editor-pane">
        <textarea
          bind:this={textareaRef}
          bind:value={content}
          class="editor-textarea"
          placeholder="Write your markdown here..."
          spellcheck="false"
        ></textarea>
      </div>
    {/if}

    <!-- Preview Pane -->
    {#if viewMode === 'preview' || viewMode === 'split'}
      <div class="preview-pane">
        <div class="preview-content">
          {@html previewHtml}
        </div>
      </div>
    {/if}
  </div>

  <!-- Status Bar -->
  <div class="status-bar">
    <div class="status-left">
      <span class="status-item">Words: {wordCount()}</span>
      <span class="status-item">Characters: {charCount()}</span>
      <span class="status-item">Characters (no spaces): {charCountNoSpaces()}</span>
    </div>
    <div class="status-right">
    </div>
  </div>
</div>

<style>
  .markdown-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    color: #f1f5f9;
    font-family: var(--desktop-font-sans);
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: #1e293b;
    border-bottom: 1px solid #334155;
    flex-shrink: 0;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    height: 44px;
    padding: 0 0.5rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: #94a3b8;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toolbar-btn:hover {
    background: #334155;
    color: #f1f5f9;
    border-color: #475569;
  }

  .toolbar-btn.active {
    background: #6366f1;
    color: white;
    border-color: #6366f1;
  }

  .toolbar-separator {
    width: 1px;
    height: 20px;
    background: #334155;
    margin: 0 0.25rem;
  }

  .view-toggle {
    background: #0f172a;
    padding: 0.25rem;
    border-radius: 6px;
  }

  /* Content Area */
  .content-area {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .content-area.split-view .editor-pane,
  .content-area.split-view .preview-pane {
    width: 50%;
  }

  .editor-pane {
    flex: 1;
    display: flex;
    border-right: 1px solid #334155;
    min-width: 0;
  }

  .split-view .editor-pane {
    flex: none;
  }

  .editor-textarea {
    flex: 1;
    width: 100%;
    padding: 1rem;
    background: #0f172a;
    border: none;
    color: #f1f5f9;
    font-family: var(--desktop-font-mono);
    font-size: var(--text-base);
    line-height: 1.6;
    resize: none;
    outline: none;
    tab-size: 2;
  }

  .editor-textarea::placeholder {
    color: #64748b;
  }

  .preview-pane {
    flex: 1;
    overflow: auto;
    min-width: 0;
  }

  .preview-content {
    padding: 1rem;
    line-height: 1.7;
  }

  /* Preview Styles */
  .preview-content :global(h1) {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #334155;
    color: #f1f5f9;
  }

  .preview-content :global(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1.5rem 0 0.75rem 0;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid #334155;
    color: #f1f5f9;
  }

  .preview-content :global(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 1.25rem 0 0.5rem 0;
    color: #e2e8f0;
  }

  .preview-content :global(h4),
  .preview-content :global(h5),
  .preview-content :global(h6) {
    font-size: 1rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
    color: #cbd5e1;
  }

  .preview-content :global(p) {
    margin: 0.75rem 0;
    color: #e2e8f0;
  }

  .preview-content :global(strong) {
    font-weight: 700;
    color: #f1f5f9;
  }

  .preview-content :global(em) {
    font-style: italic;
    color: #e2e8f0;
  }

  .preview-content :global(del) {
    text-decoration: line-through;
    color: #94a3b8;
  }

  .preview-content :global(a) {
    color: #6366f1;
    text-decoration: none;
  }

  .preview-content :global(a:hover) {
    text-decoration: underline;
  }

  .preview-content :global(ul),
  .preview-content :global(ol) {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
    color: #e2e8f0;
  }

  .preview-content :global(li) {
    margin: 0.25rem 0;
  }

  .preview-content :global(blockquote) {
    margin: 1rem 0;
    padding: 0.75rem 1rem;
    border-left: 4px solid #6366f1;
    background: rgba(99, 102, 241, 0.1);
    color: #cbd5e1;
    font-style: italic;
  }

  .preview-content :global(hr) {
    margin: 1.5rem 0;
    border: none;
    border-top: 1px solid #334155;
  }

  .preview-content :global(.code-block) {
    margin: 1rem 0;
    padding: 1rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 6px;
    overflow-x: auto;
  }

  .preview-content :global(.code-block code) {
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #e2e8f0;
  }

  .preview-content :global(.inline-code) {
    padding: 0.2rem 0.4rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 4px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 0.9em;
    color: #f472b6;
  }

  /* Syntax Highlighting */
  .preview-content :global(.hl-keyword) {
    color: #c084fc;
    font-weight: 500;
  }

  .preview-content :global(.hl-string) {
    color: #34d399;
  }

  .preview-content :global(.hl-number) {
    color: #f472b6;
  }

  .preview-content :global(.hl-comment) {
    color: #64748b;
    font-style: italic;
  }

  .preview-content :global(.hl-function) {
    color: #60a5fa;
  }

  /* Table Styles */
  .preview-content :global(table) {
    width: 100%;
    margin: 1rem 0;
    border-collapse: collapse;
    border: 1px solid #334155;
  }

  .preview-content :global(th),
  .preview-content :global(td) {
    padding: 0.5rem 0.75rem;
    border: 1px solid #334155;
    text-align: left;
  }

  .preview-content :global(th) {
    background: #1e293b;
    font-weight: 600;
    color: #f1f5f9;
  }

  .preview-content :global(td) {
    color: #e2e8f0;
  }

  .preview-content :global(tr:nth-child(even) td) {
    background: rgba(30, 41, 59, 0.5);
  }

  /* Image Styles */
  .preview-content :global(.md-image) {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
    border-radius: 6px;
    border: 1px solid #334155;
  }

  /* Status Bar */
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.75rem;
    background: #1e293b;
    border-top: 1px solid #334155;
    font-size: 12px;
    flex-shrink: 0;
  }

  .status-left {
    display: flex;
    gap: 1rem;
  }

  .status-item {
    color: #64748b;
  }

  .status-right {
    display: flex;
    align-items: center;
  }

  /* Scrollbar Styling */
  .preview-pane::-webkit-scrollbar,
  .editor-textarea::-webkit-scrollbar {
    width: var(--scrollbar-width);
    height: var(--scrollbar-width);
  }

  .preview-pane::-webkit-scrollbar-track,
  .editor-textarea::-webkit-scrollbar-track {
    background: transparent;
  }

  .preview-pane::-webkit-scrollbar-thumb,
  .editor-textarea::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: var(--radius-full);
  }

  .preview-pane::-webkit-scrollbar-thumb:hover,
  .editor-textarea::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover);
  }
</style>
