// Database utilities
export { pool, query, queryOne, testConnection } from './db';

// Notes CRUD operations
export {
  getAllNotes,
  getNote,
  saveNote,
  deleteNote,
  searchNotes,
  type Note,
} from './notes';

// Markdown file operations
export {
  saveMarkdown,
  readMarkdown,
  listMarkdownFiles,
  deleteMarkdown,
  markdownExists,
  type MarkdownFile,
  type MarkdownFileMeta,
} from './markdown';
