<script lang="ts">
  import type { StoryPost } from './types';
  import { formatDate, stories } from './data';

  interface Props {
    story: StoryPost;
    onBack: () => void;
    onSelectStory: (story: StoryPost) => void;
  }

  let { story, onBack, onSelectStory }: Props = $props();

  const relatedStories = $derived(
    stories
      .filter(s => s.id !== story.id && s.tags.some(tag => story.tags.includes(tag)))
      .slice(0, 3)
  );

  interface TOCItem {
    id: string;
    text: string;
    level: number;
  }

  const tableOfContents = $derived(() => {
    const items: TOCItem[] = [];
    const headerRegex = /^(#{1,3})\s+(.+)$/gm;
    let match;

    while ((match = headerRegex.exec(story.content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      items.push({ id, text, level });
    }

    return items;
  });

  function parseMarkdown(md: string): string {
    let html = md;

    html = html.replace(/&/g, '&amp;');
    html = html.replace(/</g, '&lt;');
    html = html.replace(/>/g, '&gt;');

    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const highlightedCode = highlightCode(code.trim(), lang);
      const langLabel = lang ? `<span class="code-lang">${lang}</span>` : '';
      return `<div class="code-block-wrapper">${langLabel}<pre class="code-block"><code>${highlightedCode}</code></pre></div>`;
    });

    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    html = parseTable(html);

    html = html.replace(/^###\s+(.+)$/gm, (_, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h3 id="${id}">${text}</h3>`;
    });
    html = html.replace(/^##\s+(.+)$/gm, (_, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h2 id="${id}">${text}</h2>`;
    });
    html = html.replace(/^#\s+(.+)$/gm, (_, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h1 id="${id}">${text}</h1>`;
    });

    html = html.replace(/^---+$/gm, '<hr />');
    html = html.replace(/^\*\*\*+$/gm, '<hr />');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    html = parseBlockquotes(html);
    html = parseLists(html);

    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');
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
          if (inOl) { result.push('</ol>'); inOl = false; }
          result.push('<ul>');
          inUl = true;
        }
        result.push(`<li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (!inOl) {
          if (inUl) { result.push('</ul>'); inUl = false; }
          result.push('<ol>');
          inOl = true;
        }
        result.push(`<li>${olMatch[1]}</li>`);
      } else {
        if (inUl) { result.push('</ul>'); inUl = false; }
        if (inOl) { result.push('</ol>'); inOl = false; }
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

    if (inTable) result.push('</tbody></table>');
    return result.join('\n');
  }

  function highlightCode(code: string, lang: string): string {
    let highlighted = code;

    const jsKeywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'typeof', 'instanceof', 'interface', 'type', 'extends', 'implements'];
    const pyKeywords = ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'yield', 'pass', 'break', 'continue', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is'];

    const keywords = lang === 'python' || lang === 'py' ? pyKeywords : jsKeywords;

    highlighted = highlighted.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-string">$1</span>');
    highlighted = highlighted.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>');
    highlighted = highlighted.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="hl-string">$1</span>');

    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="hl-comment">$1</span>');
    highlighted = highlighted.replace(/(#.*$)/gm, '<span class="hl-comment">$1</span>');

    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
      highlighted = highlighted.replace(regex, '<span class="hl-keyword">$1</span>');
    }

    highlighted = highlighted.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="hl-function">$1</span>(');

    return highlighted;
  }

  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const renderedContent = $derived(parseMarkdown(story.content));
</script>

<div class="article-view">
  <header class="article-header">
    <button class="back-btn" onclick={onBack} type="button">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back
    </button>
    <span class="format-badge">Article</span>
  </header>

  <div class="content-wrapper">
    {#if tableOfContents().length > 2}
      <aside class="toc">
        <h4>Contents</h4>
        <nav>
          {#each tableOfContents() as item}
            <button
              class="toc-item level-{item.level}"
              onclick={() => scrollToSection(item.id)}
              type="button"
            >
              {item.text}
            </button>
          {/each}
        </nav>
      </aside>
    {/if}

    <article class="article">
      {#if story.coverImage}
        <div class="cover-image">
          <img src={story.coverImage} alt={story.title} />
        </div>
      {/if}

      <div class="article-meta">
        <div class="author">
          {#if story.author.avatar}
            <img src={story.author.avatar} alt={story.author.name} class="author-avatar" />
          {/if}
          <span class="author-name">{story.author.name}</span>
        </div>
        <span class="separator">&middot;</span>
        <time datetime={story.publishedAt}>{formatDate(story.publishedAt)}</time>
        <span class="separator">&middot;</span>
        <span class="read-time">{story.readTime} min read</span>
      </div>

      <div class="tags">
        {#each story.tags as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>

      <div class="article-content">
        {@html renderedContent}
      </div>
    </article>
  </div>

  {#if relatedStories.length > 0}
    <section class="related">
      <h3>Related Stories</h3>
      <div class="related-grid">
        {#each relatedStories as related}
          <button class="related-card" onclick={() => onSelectStory(related)} type="button">
            <span class="related-format">{related.format === 'slides' ? '\u{1F3AC}' : related.format === 'scroll' ? '\u{1F4DC}' : '\u{1F4DD}'}</span>
            <h4>{related.title}</h4>
            <div class="related-meta">
              <span>{related.readTime} min</span>
              <span>&middot;</span>
              <span>{related.format}</span>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .article-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    overflow-y: auto;
  }

  .article-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: var(--glass-bg-strong);
    border-bottom: 1px solid #334155;
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(var(--glass-blur));
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #334155;
    border-radius: var(--radius-md);
    color: #94a3b8;
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-easing);
    min-height: 36px;
  }

  .back-btn:hover {
    background: #334155;
    color: #f1f5f9;
  }

  .format-badge {
    padding: 0.25rem 0.75rem;
    background: rgba(var(--desktop-accent-rgb), 0.15);
    border: 1px solid rgba(var(--desktop-accent-rgb), 0.3);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 600;
    color: #a5b4fc;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .content-wrapper {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .toc {
    width: 220px;
    padding: 1.5rem;
    border-right: 1px solid #334155;
    position: sticky;
    top: 52px;
    height: fit-content;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }

  .toc h4 {
    margin: 0 0 1rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
  }

  .toc nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .toc-item {
    background: none;
    border: none;
    padding: 0.25rem 0;
    text-align: left;
    font-size: 0.8125rem;
    color: #94a3b8;
    cursor: pointer;
    transition: color var(--transition-fast) var(--transition-easing);
    line-height: 1.4;
  }

  .toc-item:hover { color: #6366f1; }
  .toc-item.level-2 { padding-left: 0.75rem; }
  .toc-item.level-3 { padding-left: 1.5rem; font-size: 0.75rem; }

  .article {
    flex: 1;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .cover-image {
    margin: -2rem -2rem 2rem -2rem;
    height: 300px;
    overflow: hidden;
  }

  .cover-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .article-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .author {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .author-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
  }

  .author-name {
    font-weight: 500;
    color: #e2e8f0;
  }

  .separator { color: #475569; }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  .tag {
    padding: 4px 12px;
    background: rgba(var(--desktop-accent-rgb), 0.1);
    border: 1px solid rgba(var(--desktop-accent-rgb), 0.2);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    color: #a5b4fc;
  }

  /* Article Content */
  .article-content { line-height: 1.8; color: #e2e8f0; }
  .article-content :global(h1) { font-size: 2.25rem; font-weight: 700; margin: 0 0 1.5rem 0; color: #f1f5f9; line-height: 1.3; }
  .article-content :global(h2) { font-size: 1.5rem; font-weight: 600; margin: 2.5rem 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid #334155; color: #f1f5f9; }
  .article-content :global(h3) { font-size: 1.25rem; font-weight: 600; margin: 2rem 0 0.75rem 0; color: #e2e8f0; }
  .article-content :global(p) { margin: 1rem 0; }
  .article-content :global(strong) { font-weight: 600; color: #f1f5f9; }
  .article-content :global(a) { color: #6366f1; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color var(--transition-fast) var(--transition-easing); }
  .article-content :global(a:hover) { border-bottom-color: #6366f1; }
  .article-content :global(ul), .article-content :global(ol) { margin: 1rem 0; padding-left: 1.5rem; }
  .article-content :global(li) { margin: 0.5rem 0; }
  .article-content :global(blockquote) { margin: 1.5rem 0; padding: 1rem 1.25rem; border-left: 4px solid #6366f1; background: rgba(99, 102, 241, 0.1); border-radius: 0 var(--radius-md) var(--radius-md) 0; color: #cbd5e1; font-style: italic; }
  .article-content :global(hr) { margin: 2rem 0; border: none; border-top: 1px solid #334155; }

  .article-content :global(.code-block-wrapper) { position: relative; margin: 1.5rem 0; }
  .article-content :global(.code-lang) { position: absolute; top: 0; right: 0; padding: 0.25rem 0.75rem; background: #334155; border-radius: 0 var(--radius-md) 0 var(--radius-md); font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: #94a3b8; }
  .article-content :global(.code-block) { margin: 0; padding: 1.25rem; background: #1e293b; border: 1px solid #334155; border-radius: var(--radius-md); overflow-x: auto; }
  .article-content :global(.code-block code) { font-family: var(--desktop-font-mono); font-size: 0.8125rem; line-height: 1.6; color: #e2e8f0; }
  .article-content :global(.inline-code) { padding: 0.2rem 0.4rem; background: #1e293b; border: 1px solid #334155; border-radius: var(--radius-sm); font-family: var(--desktop-font-mono); font-size: 0.85em; color: #f472b6; }

  .article-content :global(.hl-keyword) { color: #c084fc; }
  .article-content :global(.hl-string) { color: #34d399; }
  .article-content :global(.hl-number) { color: #f472b6; }
  .article-content :global(.hl-comment) { color: #64748b; font-style: italic; }
  .article-content :global(.hl-function) { color: #60a5fa; }

  .article-content :global(table) { width: 100%; margin: 1.5rem 0; border-collapse: collapse; border: 1px solid #334155; border-radius: var(--radius-md); overflow: hidden; }
  .article-content :global(th), .article-content :global(td) { padding: 0.75rem 1rem; border: 1px solid #334155; text-align: left; }
  .article-content :global(th) { background: #1e293b; font-weight: 600; color: #f1f5f9; }
  .article-content :global(tr:nth-child(even) td) { background: rgba(30, 41, 59, 0.5); }

  /* Related */
  .related {
    padding: 1.5rem;
    background: #1e293b;
    border-top: 1px solid #334155;
  }

  .related h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #f1f5f9;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.75rem;
  }

  .related-card {
    padding: 1rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: var(--radius-md);
    text-align: left;
    cursor: pointer;
    transition: all var(--transition-fast) var(--transition-easing);
    font-family: inherit;
    color: inherit;
  }

  .related-card:hover {
    border-color: #6366f1;
    transform: var(--card-hover-transform);
    box-shadow: var(--card-hover-shadow);
  }

  .related-format { font-size: 1.25rem; }

  .related-card h4 {
    margin: 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: #f1f5f9;
    line-height: 1.4;
  }

  .related-meta {
    display: flex;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #64748b;
  }

  /* Scrollbar */
  .article-view::-webkit-scrollbar { width: var(--scrollbar-width); }
  .article-view::-webkit-scrollbar-track { background: transparent; }
  .article-view::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: var(--radius-full); }
  .article-view::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

  .back-btn:focus-visible, .related-card:focus-visible {
    outline: 2px solid rgba(99, 102, 241, 0.6);
    outline-offset: 2px;
  }

  @media (max-width: 900px) {
    .toc { display: none; }
    .article { padding: 1.5rem; }
    .cover-image { margin: -1.5rem -1.5rem 1.5rem -1.5rem; height: 200px; }
  }
</style>
