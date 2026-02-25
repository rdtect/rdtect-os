import { readFile, writeFile, readdir, mkdir, unlink, stat } from 'fs/promises';
import { join, basename, extname } from 'path';
import { existsSync } from 'fs';

// Base directory for markdown files
const MARKDOWN_DIR = process.env.MARKDOWN_DIR || join(process.cwd(), 'data', 'markdown');

/**
 * Ensure the markdown directory exists
 */
async function ensureMarkdownDir(): Promise<void> {
  if (!existsSync(MARKDOWN_DIR)) {
    await mkdir(MARKDOWN_DIR, { recursive: true });
  }
}

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

/**
 * Get the full path for a markdown file
 */
function getFilePath(filename: string): string {
  // Sanitize filename to prevent directory traversal
  const sanitized = basename(filename);
  const name = sanitized.endsWith('.md') ? sanitized : `${sanitized}.md`;
  return join(MARKDOWN_DIR, name);
}

/**
 * Save markdown content to a file
 */
export async function saveMarkdown(filename: string, content: string): Promise<MarkdownFile> {
  await ensureMarkdownDir();

  const filePath = getFilePath(filename);
  await writeFile(filePath, content, 'utf-8');

  const stats = await stat(filePath);

  return {
    filename: basename(filePath),
    content,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };
}

/**
 * Read a markdown file
 */
export async function readMarkdown(filename: string): Promise<MarkdownFile | null> {
  await ensureMarkdownDir();

  const filePath = getFilePath(filename);

  if (!existsSync(filePath)) {
    return null;
  }

  const [content, stats] = await Promise.all([
    readFile(filePath, 'utf-8'),
    stat(filePath),
  ]);

  return {
    filename: basename(filePath),
    content,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };
}

/**
 * List all markdown files in the directory
 */
export async function listMarkdownFiles(): Promise<MarkdownFileMeta[]> {
  await ensureMarkdownDir();

  const files = await readdir(MARKDOWN_DIR);
  const markdownFiles = files.filter((f) => extname(f) === '.md');

  const filesMeta: MarkdownFileMeta[] = await Promise.all(
    markdownFiles.map(async (filename) => {
      const filePath = join(MARKDOWN_DIR, filename);
      const stats = await stat(filePath);
      return {
        filename,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        size: stats.size,
      };
    })
  );

  // Sort by modified date descending
  return filesMeta.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
}

/**
 * Delete a markdown file
 */
export async function deleteMarkdown(filename: string): Promise<boolean> {
  const filePath = getFilePath(filename);

  if (!existsSync(filePath)) {
    return false;
  }

  await unlink(filePath);
  return true;
}

/**
 * Check if a markdown file exists
 */
export async function markdownExists(filename: string): Promise<boolean> {
  const filePath = getFilePath(filename);
  return existsSync(filePath);
}
