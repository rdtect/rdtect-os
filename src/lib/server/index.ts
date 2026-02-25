// Notes CRUD operations (filesystem-backed)
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
