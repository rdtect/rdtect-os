import { saveMarkdown, readMarkdown, listMarkdownFiles, deleteMarkdown } from './markdown';

export interface Note {
  id: string;
  title: string;
  content: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function getAllNotes(): Promise<Note[]> {
  const files = await listMarkdownFiles();
  const notes: Note[] = [];

  for (const meta of files) {
    const file = await readMarkdown(meta.filename);
    if (file) {
      notes.push({
        id: meta.filename.replace(/\.md$/, ''),
        title: meta.filename.replace(/\.md$/, ''),
        content: file.content,
        created_at: meta.createdAt,
        updated_at: meta.modifiedAt,
      });
    }
  }

  return notes;
}

export async function getNote(id: string): Promise<Note | null> {
  const file = await readMarkdown(id);
  if (!file) return null;

  return {
    id,
    title: file.filename.replace(/\.md$/, ''),
    content: file.content,
    created_at: file.createdAt,
    updated_at: file.modifiedAt,
  };
}

export async function saveNote(note: {
  id: string;
  title: string;
  content?: string | null;
}): Promise<Note> {
  const filename = note.id.endsWith('.md') ? note.id : `${note.id}.md`;
  const file = await saveMarkdown(filename, note.content ?? '');

  return {
    id: note.id,
    title: note.title,
    content: file.content,
    created_at: file.createdAt,
    updated_at: file.modifiedAt,
  };
}

export async function deleteNote(id: string): Promise<boolean> {
  return deleteMarkdown(id);
}

export async function searchNotes(searchTerm: string): Promise<Note[]> {
  const all = await getAllNotes();
  const term = searchTerm.toLowerCase();
  return all.filter(
    (n) =>
      n.title.toLowerCase().includes(term) ||
      n.content?.toLowerCase().includes(term)
  );
}
