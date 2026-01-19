<script lang="ts">
  import type { BlogPost } from './data';
  import { formatDate, samplePosts } from './data';

  interface Props {
    post: BlogPost;
    onBack: () => void;
    onSelectPost: (post: BlogPost) => void;
  }

  let { post, onBack, onSelectPost }: Props = $props();

  // Get related posts (same tags, excluding current)
  const relatedPosts = $derived(
    samplePosts
      .filter(p => p.id !== post.id && p.tags.some(tag => post.tags.includes(tag)))
      .slice(0, 3)
  );

  // Generate table of contents from headers
  interface TOCItem {
    id: string;
    text: string;
    level: number;
  }

  const tableOfContents = $derived(() => {
    const items: TOCItem[] = [];
    const headerRegex = /^(#{1,3})\s+(.+)$/gm;
    let match;

    while ((match = headerRegex.exec(post.content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      items.push({ id, text, level });
    }

    return items;
  });

  // Parse markdown to HTML
  function parseMarkdown(md: string): string {
    let html = md;

    // Escape HTML entities first
    html = html.replace(/&/g, '&amp;');
    html = html.replace(/</g, '&lt;');
    html = html.replace(/>/g, '&gt;');

    // Code blocks with syntax highlighting
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const highlightedCode = highlightCode(code.trim(), lang);
      const langLabel = lang ? `<span class="code-lang">${lang}</span>` : '';
      return `<div class="code-block-wrapper">${langLabel}<pre class="code-block"><code>${highlightedCode}</code></pre></div>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Tables
    html = parseTable(html);

    // Headers with IDs for TOC
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

    // Horizontal rules
    html = html.replace(/^---+$/gm, '<hr />');
    html = html.replace(/^\*\*\*+$/gm, '<hr />');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Blockquotes
    html = parseBlockquotes(html);

    // Lists
    html = parseLists(html);

    // Paragraphs
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

    // Strings
    highlighted = highlighted.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-string">$1</span>');
    highlighted = highlighted.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>');
    highlighted = highlighted.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="hl-string">$1</span>');

    // Comments
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="hl-comment">$1</span>');
    highlighted = highlighted.replace(/(#.*$)/gm, '<span class="hl-comment">$1</span>');

    // Numbers
    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');

    // Keywords
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
      highlighted = highlighted.replace(regex, '<span class="hl-keyword">$1</span>');
    }

    // Functions
    highlighted = highlighted.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="hl-function">$1</span>(');

    return highlighted;
  }

  // Share functionality
  function copyLink() {
    navigator.clipboard.writeText(`https://rdtect.dev/blog/${post.slug}`);
    // Could add a toast notification here
  }

  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const renderedContent = $derived(parseMarkdown(post.content));
</script>

<div class="post-view">
  <!-- Header -->
  <header class="post-header">
    <button class="back-btn" onclick={onBack} type="button">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Back to Posts
    </button>

    <div class="share-actions">
      <button class="share-btn" onclick={copyLink} title="Copy link" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- Main Content Area -->
  <div class="content-wrapper">
    <!-- Table of Contents (Sidebar) -->
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

    <!-- Article -->
    <article class="article">
      {#if post.coverImage}
        <div class="cover-image">
          <img src={post.coverImage} alt={post.title} />
        </div>
      {/if}

      <div class="article-meta">
        <div class="author">
          {#if post.author.avatar}
            <img src={post.author.avatar} alt={post.author.name} class="author-avatar" />
          {/if}
          <span class="author-name">{post.author.name}</span>
        </div>
        <span class="separator">-</span>
        <time datetime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        <span class="separator">-</span>
        <span class="read-time">{post.readTime} min read</span>
      </div>

      <div class="tags">
        {#each post.tags as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>

      <div class="article-content">
        {@html renderedContent}
      </div>

      {#if post.updatedAt && post.updatedAt !== post.publishedAt}
        <div class="updated-notice">
          Last updated on {formatDate(post.updatedAt)}
        </div>
      {/if}
    </article>
  </div>

  <!-- Related Posts -->
  {#if relatedPosts.length > 0}
    <section class="related-posts">
      <h3>Related Posts</h3>
      <div class="related-grid">
        {#each relatedPosts as relatedPost}
          <button
            class="related-card"
            onclick={() => onSelectPost(relatedPost)}
            type="button"
          >
            <h4>{relatedPost.title}</h4>
            <div class="related-meta">
              <span>{relatedPost.readTime} min read</span>
              <span>-</span>
              <span>{formatDate(relatedPost.publishedAt)}</span>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .post-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    overflow-y: auto;
  }

  /* Header */
  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: #1e293b;
    border-bottom: 1px solid #334155;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #94a3b8;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .back-btn:hover {
    background: #334155;
    color: #f1f5f9;
  }

  .share-actions {
    display: flex;
    gap: 0.5rem;
  }

  .share-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .share-btn:hover {
    background: #6366f1;
    border-color: #6366f1;
    color: white;
  }

  /* Content Wrapper */
  .content-wrapper {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  /* Table of Contents */
  .toc {
    width: 220px;
    padding: 1.5rem;
    border-right: 1px solid #334155;
    position: sticky;
    top: 60px;
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
    transition: color 0.15s ease;
    line-height: 1.4;
  }

  .toc-item:hover {
    color: #6366f1;
  }

  .toc-item.level-2 {
    padding-left: 0.75rem;
  }

  .toc-item.level-3 {
    padding-left: 1.5rem;
    font-size: 0.75rem;
  }

  /* Article */
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

  .separator {
    color: #475569;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  .tag {
    padding: 4px 12px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 6px;
    font-size: 0.75rem;
    color: #a5b4fc;
  }

  /* Article Content Styles */
  .article-content {
    line-height: 1.8;
    color: #e2e8f0;
  }

  .article-content :global(h1) {
    font-size: 2.25rem;
    font-weight: 700;
    margin: 0 0 1.5rem 0;
    color: #f1f5f9;
    line-height: 1.3;
  }

  .article-content :global(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 2.5rem 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #334155;
    color: #f1f5f9;
  }

  .article-content :global(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 2rem 0 0.75rem 0;
    color: #e2e8f0;
  }

  .article-content :global(p) {
    margin: 1rem 0;
  }

  .article-content :global(strong) {
    font-weight: 600;
    color: #f1f5f9;
  }

  .article-content :global(a) {
    color: #6366f1;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.15s ease;
  }

  .article-content :global(a:hover) {
    border-bottom-color: #6366f1;
  }

  .article-content :global(ul),
  .article-content :global(ol) {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  .article-content :global(li) {
    margin: 0.5rem 0;
  }

  .article-content :global(blockquote) {
    margin: 1.5rem 0;
    padding: 1rem 1.25rem;
    border-left: 4px solid #6366f1;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 0 8px 8px 0;
    color: #cbd5e1;
    font-style: italic;
  }

  .article-content :global(hr) {
    margin: 2rem 0;
    border: none;
    border-top: 1px solid #334155;
  }

  /* Code Blocks */
  .article-content :global(.code-block-wrapper) {
    position: relative;
    margin: 1.5rem 0;
  }

  .article-content :global(.code-lang) {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0.25rem 0.75rem;
    background: #334155;
    border-radius: 0 8px 0 8px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #94a3b8;
  }

  .article-content :global(.code-block) {
    margin: 0;
    padding: 1.25rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    overflow-x: auto;
  }

  .article-content :global(.code-block code) {
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: #e2e8f0;
  }

  .article-content :global(.inline-code) {
    padding: 0.2rem 0.4rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 4px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 0.85em;
    color: #f472b6;
  }

  /* Syntax Highlighting */
  .article-content :global(.hl-keyword) {
    color: #c084fc;
  }

  .article-content :global(.hl-string) {
    color: #34d399;
  }

  .article-content :global(.hl-number) {
    color: #f472b6;
  }

  .article-content :global(.hl-comment) {
    color: #64748b;
    font-style: italic;
  }

  .article-content :global(.hl-function) {
    color: #60a5fa;
  }

  /* Table Styles */
  .article-content :global(table) {
    width: 100%;
    margin: 1.5rem 0;
    border-collapse: collapse;
    border: 1px solid #334155;
    border-radius: 8px;
    overflow: hidden;
  }

  .article-content :global(th),
  .article-content :global(td) {
    padding: 0.75rem 1rem;
    border: 1px solid #334155;
    text-align: left;
  }

  .article-content :global(th) {
    background: #1e293b;
    font-weight: 600;
    color: #f1f5f9;
  }

  .article-content :global(tr:nth-child(even) td) {
    background: rgba(30, 41, 59, 0.5);
  }

  .updated-notice {
    margin-top: 2rem;
    padding: 0.75rem 1rem;
    background: rgba(100, 116, 139, 0.1);
    border-radius: 8px;
    font-size: 0.8125rem;
    color: #64748b;
    font-style: italic;
  }

  /* Related Posts */
  .related-posts {
    padding: 2rem;
    background: #1e293b;
    border-top: 1px solid #334155;
  }

  .related-posts h3 {
    margin: 0 0 1.5rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #f1f5f9;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .related-card {
    padding: 1rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: inherit;
    color: inherit;
  }

  .related-card:hover {
    border-color: #6366f1;
    transform: translateY(-2px);
  }

  .related-card h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9375rem;
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
  .post-view::-webkit-scrollbar {
    width: 8px;
  }

  .post-view::-webkit-scrollbar-track {
    background: #0f172a;
  }

  .post-view::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 4px;
  }

  .post-view::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }

  /* Responsive */
  @media (max-width: 900px) {
    .toc {
      display: none;
    }

    .article {
      padding: 1.5rem;
    }

    .cover-image {
      margin: -1.5rem -1.5rem 1.5rem -1.5rem;
      height: 200px;
    }
  }
</style>
