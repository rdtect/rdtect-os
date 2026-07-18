/**
 * Populate D1 with article embeddings from vault + writing routes
 * Usage: node --loader ts-node/esm scripts/populate-embeddings.ts
 * Or integrate into build pipeline
 */

import * as fs from 'fs';
import * as path from 'path';

const VAULT_ROOT = path.join(process.env.HOME || '/Users/rick.d', 'Documents/rdtect');
const WRITING_DIRS = [
  path.join(VAULT_ROOT, '1_Atlas/personal/brand/content'),
  path.join(VAULT_ROOT, '3_Efforts/rdtect'),
];

interface Article {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  content: string;
}

// Minimal article discovery from vault
function discoverArticles(): Article[] {
  const articles: Article[] = [];
  const seen = new Set<string>();

  for (const dir of WRITING_DIRS) {
    if (!fs.existsSync(dir)) continue;

    const files = walkDir(dir, 10); // limit depth
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const key = path.basename(file);
      if (seen.has(key)) continue;
      seen.add(key);

      try {
        const content = fs.readFileSync(file, 'utf8');
        const frontmatter = extractFrontmatter(content);

        if (frontmatter.title && frontmatter.type?.includes('article') || frontmatter.type?.includes('note')) {
          articles.push({
            id: path.basename(file, '.md'),
            title: frontmatter.title || 'Untitled',
            excerpt: frontmatter.excerpt || extractExcerpt(content, 100),
            url: `/articles/${path.basename(file, '.md')}`,
            content: stripFrontmatter(content)
          });
        }
      } catch (err) {
        // skip unparseable files
      }
    }
  }

  return articles;
}

function walkDir(dir: string, maxDepth: number, depth = 0): string[] {
  if (depth > maxDepth) return [];

  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkDir(fullPath, maxDepth, depth + 1));
      } else {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // skip inaccessible dirs
  }
  return files;
}

function extractFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result: Record<string, any> = {};

  for (const line of yaml.split('\n')) {
    const [key, val] = line.split(':').map(s => s.trim());
    if (key) {
      result[key] = val ? val.replace(/^["']|["']$/g, '') : null;
    }
  }

  return result;
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n/, '');
}

function extractExcerpt(content: string, length: number): string {
  const text = stripFrontmatter(content)
    .replace(/#+\s*/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .trim();
  return text.slice(0, length).trim();
}

// Mock embedding function (replace with CF API in production)
async function embedArticles(articles: Article[]): Promise<Array<Article & { embedding: number[] }>> {
  console.log(`📚 Discovered ${articles.length} articles`);
  console.log('⏸️  Skipping actual embedding (requires CF AI binding context)');
  console.log('💡 In production, this runs server-side with CF AI binding.');
  console.log('');

  // For now, return articles with placeholder embeddings
  // The actual embedding happens at request time or via a separate ingestion endpoint
  return articles.map(art => ({
    ...art,
    embedding: Array(384).fill(0)
  }));
}

async function main() {
  console.log('🔍 Scanning vault for articles...\n');

  const articles = discoverArticles();
  const withEmbeddings = await embedArticles(articles);

  console.log('✅ Ready to ingest:');
  for (const art of withEmbeddings.slice(0, 5)) {
    console.log(`  - ${art.title} (${art.excerpt.slice(0, 40)}...)`);
  }
  if (withEmbeddings.length > 5) {
    console.log(`  ... and ${withEmbeddings.length - 5} more`);
  }

  console.log('\n📝 To populate D1, run:');
  console.log('   wrangler d1 execute rdtect_search --remote < schema.sql');
  console.log('   Then: POST /api/search/populate with articles payload');
}

main().catch(console.error);
