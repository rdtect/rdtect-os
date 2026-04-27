/**
 * Markdown file storage
 *
 * This module provides a filesystem-based markdown storage backend.
 * On Cloudflare Workers/Pages, fs is unavailable — operations return empty/error gracefully.
 */

export interface MarkdownFile {
  filename: string;
  content: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface MarkdownFileMeta {
  filename: string;
  createdAt: Date;
  modifiedAt: Date;
  size: number;
}

// Dynamic import for Node.js fs — unavailable on edge runtimes
let fsAvailable = false;
let fsPromises: typeof import('fs/promises') | null = null;
let fsSync: typeof import('fs') | null = null;
let pathModule: typeof import('path') | null = null;

try {
  fsPromises = await import('fs/promises');
  fsSync = await import('fs');
  pathModule = await import('path');
  fsAvailable = true;
} catch {
  // Edge runtime — fs not available
}

const MARKDOWN_DIR = fsAvailable && pathModule
  ? (process.env.MARKDOWN_DIR || pathModule.join(process.cwd(), 'data', 'markdown'))
  : '';

async function ensureMarkdownDir(): Promise<void> {
  if (!fsAvailable || !fsSync || !fsPromises) return;
  if (!fsSync.existsSync(MARKDOWN_DIR)) {
    await fsPromises.mkdir(MARKDOWN_DIR, { recursive: true });
  }
}

function getFilePath(filename: string): string {
  if (!pathModule) return filename;
  const sanitized = pathModule.basename(filename);
  const name = sanitized.endsWith('.md') ? sanitized : `${sanitized}.md`;
  return pathModule.join(MARKDOWN_DIR, name);
}

export async function saveMarkdown(filename: string, content: string): Promise<MarkdownFile> {
  if (!fsAvailable || !fsPromises || !pathModule) {
    throw new Error('File storage not available in edge runtime');
  }
  await ensureMarkdownDir();
  const filePath = getFilePath(filename);
  await fsPromises.writeFile(filePath, content, 'utf-8');
  const stats = await fsPromises.stat(filePath);
  return {
    filename: pathModule.basename(filePath),
    content,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };
}

export async function readMarkdown(filename: string): Promise<MarkdownFile | null> {
  if (!fsAvailable || !fsPromises || !fsSync || !pathModule) return null;
  await ensureMarkdownDir();
  const filePath = getFilePath(filename);
  if (!fsSync.existsSync(filePath)) return null;
  const [content, stats] = await Promise.all([
    fsPromises.readFile(filePath, 'utf-8'),
    fsPromises.stat(filePath),
  ]);
  return {
    filename: pathModule.basename(filePath),
    content,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };
}

export async function listMarkdownFiles(): Promise<MarkdownFileMeta[]> {
  if (!fsAvailable || !fsPromises || !pathModule) return [];
  await ensureMarkdownDir();
  const files = await fsPromises.readdir(MARKDOWN_DIR);
  const markdownFiles = files.filter((f) => pathModule!.extname(f) === '.md');
  const filesMeta: MarkdownFileMeta[] = await Promise.all(
    markdownFiles.map(async (filename) => {
      const filePath = pathModule!.join(MARKDOWN_DIR, filename);
      const stats = await fsPromises!.stat(filePath);
      return {
        filename,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        size: stats.size,
      };
    })
  );
  return filesMeta.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
}

export async function deleteMarkdown(filename: string): Promise<boolean> {
  if (!fsAvailable || !fsPromises || !fsSync) return false;
  const filePath = getFilePath(filename);
  if (!fsSync.existsSync(filePath)) return false;
  await fsPromises.unlink(filePath);
  return true;
}

export async function markdownExists(filename: string): Promise<boolean> {
  if (!fsAvailable || !fsSync) return false;
  const filePath = getFilePath(filename);
  return fsSync.existsSync(filePath);
}
